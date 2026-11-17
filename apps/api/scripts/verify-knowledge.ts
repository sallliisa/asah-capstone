import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { and, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod/v4'
import { closeDb, getDb } from '../src/db'
import { embedTexts, embeddingDimensions, embeddingModel, queryVectors } from '../src/knowledge/cloudflare'
import { knowledgeChunks, knowledgeIndexVersions } from '../src/routes/(authenticated)/knowledge/knowledge.table'

const versionId = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .parse(process.argv[2])
const activate = process.argv.includes('--activate')
const examples = z
  .array(z.object({ split: z.enum(['validation', 'test']), question: z.string(), area: z.string(), documentId: z.string().nullable(), section: z.string().nullable() }))
  .parse(JSON.parse(await readFile(new URL('../knowledge/evaluation.json', import.meta.url), 'utf8')))
try {
  const version = (await getDb().select().from(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, versionId)))[0]
  if (!version || !['indexed', 'verified'].includes(version.state) || version.embeddingModel !== embeddingModel || version.dimensions !== embeddingDimensions)
    throw new Error('Select an indexed candidate version')
  const chunks = await getDb().select().from(knowledgeChunks).where(eq(knowledgeChunks.versionId, versionId))
  const vectors = await embedTexts(examples.map((example) => example.question))
  const rows = await Promise.all(
    examples.map(async (example, index) => {
      const matches = await queryVectors({ indexName: version.indexName, vector: vectors[index], versionId, area: example.area })
      return {
        ...example,
        matches: matches.map((match) => {
          const chunk = chunks.find((chunk) => chunk.vectorId === match.id)
          return {
            ...match,
            documentId: chunk?.documentId ?? null,
            section: chunk?.section ?? null,
            correct: example.documentId !== null && chunk?.documentId === example.documentId && chunk.section === example.section,
          }
        }),
      }
    })
  )
  function evaluate(split: string, cutoff: number) {
    const selected = rows.filter((row) => row.split === split)
    const matches = selected.flatMap((row) => row.matches.filter((match) => match.score >= cutoff))
    const positives = selected.filter((row) => row.documentId !== null)
    const found = positives.filter((row) => row.matches.some((match) => match.score >= cutoff && match.correct)).length
    const precision = matches.length ? matches.filter((match) => match.correct).length / matches.length : 0
    const recall = positives.length ? found / positives.length : 0
    const unsupported = selected.filter((row) => row.documentId === null && row.matches.some((match) => match.score >= cutoff)).length
    return { precision, recall, unsupported, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0 }
  }
  const scores = [...new Set(rows.filter((row) => row.split === 'validation').flatMap((row) => row.matches.map((match) => match.score)))].sort((a, b) => a - b)
  if (!scores.length) throw new Error('Vector mutations are not visible or no validation matches were found')
  const candidates = [Math.max(...scores) + Number.EPSILON, ...scores].map((cutoff) => ({ cutoff, ...evaluate('validation', cutoff) }))
  candidates.sort((a, b) => b.f1 - a.f1 || b.precision - a.precision || b.cutoff - a.cutoff)
  const chosen = candidates[0]
  const test = evaluate('test', chosen.cutoff)
  const passed = chosen.precision >= 0.9 && chosen.recall >= 0.75 && test.precision >= 0.9 && test.recall >= 0.75 && test.unsupported === 0
  const report = { versionId, minimumScore: chosen.cutoff, validation: chosen, test, passed, rows, scope: 'Retrieval only. Generation and source use require native chat evidence.' }
  const evidence = new URL('../../../.local/verification/rag/', import.meta.url)
  await mkdir(evidence, { recursive: true })
  await writeFile(new URL(`${versionId}.json`, evidence), JSON.stringify(report, null, 2) + '\n')
  if (passed) await getDb().update(knowledgeIndexVersions).set({ state: 'verified', minimumScore: chosen.cutoff, error: null }).where(eq(knowledgeIndexVersions.id, versionId))
  if (activate) {
    if (!passed) throw new Error('Retrieval verification failed. The previous active corpus is unchanged.')
    await getDb().transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('kos-knowledge-activate'))`)
      const candidate = (await tx.select().from(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, versionId)).for('update'))[0]
      if (candidate?.state !== 'verified' || candidate.minimumScore !== chosen.cutoff) throw new Error('Candidate changed before activation')
      await tx
        .update(knowledgeIndexVersions)
        .set({ state: 'retired' })
        .where(and(eq(knowledgeIndexVersions.embeddingModel, version.embeddingModel), eq(knowledgeIndexVersions.state, 'active'), ne(knowledgeIndexVersions.id, versionId)))
      await tx
        .update(knowledgeIndexVersions)
        .set({ state: 'active', activatedAt: new Date().toISOString() })
        .where(and(eq(knowledgeIndexVersions.id, versionId), eq(knowledgeIndexVersions.state, 'verified')))
    })
  }
  console.log(JSON.stringify({ versionId, minimumScore: chosen.cutoff, validation: chosen, test, passed, activated: activate && passed }))
  if (!passed) process.exitCode = 1
} finally {
  await closeDb()
}
