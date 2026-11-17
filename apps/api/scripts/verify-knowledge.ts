import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { closeDb, getDb } from '../src/db'
import { embedTexts, embeddingDimensions, embeddingModel, queryVectors } from '../src/knowledge/cloudflare'
import { knowledgeChunks, knowledgeIndexVersions } from '../src/routes/(authenticated)/knowledge/knowledge.table'

import { candidateLimit, rankGuidance, rerankerModel, retrievalPolicy } from '../src/knowledge/rank'

const [versionId] = z.tuple([z.string().regex(/^[a-f0-9]{64}$/)]).parse(process.argv.slice(2))
const examples = z
  .array(
    z.object({
      split: z.enum(['validation', 'test']),
      question: z.string(),
      area: z.string(),
      documentId: z.string().nullable(),
      section: z.string().nullable(),
      alternatives: z.array(z.object({ documentId: z.string(), section: z.string() })).optional(),
    })
  )
  .parse(JSON.parse(await readFile(new URL('../knowledge/evaluation.json', import.meta.url), 'utf8')))
try {
  const version = (await getDb().select().from(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, versionId)))[0]
  if (
    !version ||
    !['indexed', 'verified'].includes(version.state) ||
    version.embeddingModel !== embeddingModel ||
    version.dimensions !== embeddingDimensions ||
    version.rerankerModel !== rerankerModel ||
    version.retrievalPolicy !== retrievalPolicy
  )
    throw new Error('Select an indexed candidate version')
  const chunks = await getDb().select().from(knowledgeChunks).where(eq(knowledgeChunks.versionId, versionId))
  const vectors = await embedTexts(examples.map((example) => example.question))
  async function retrieveExample(example: (typeof examples)[number], index: number) {
    const candidates = await queryVectors({
      indexName: version.indexName,
      vector: vectors[index],
      versionId,
      area: example.area,
      topK: candidateLimit,
    })
    const permitted = candidates.flatMap((match) => {
      const chunk = chunks.find((chunk) => chunk.vectorId === match.id && [example.area, 'guidance'].includes(chunk.area))
      return chunk ? [{ id: match.id, title: chunk.title, section: chunk.section, text: chunk.text, vectorScore: match.score }] : []
    })
    const matches = await rankGuidance(example.question, permitted)
    return {
      ...example,
      matches: matches.map((match) => {
        const chunk = chunks.find((chunk) => chunk.vectorId === match.id)
        return {
          ...match,
          documentId: chunk?.documentId ?? null,
          section: chunk?.section ?? null,
          correct:
            example.documentId !== null &&
            [{ documentId: example.documentId, section: example.section }, ...(example.alternatives ?? [])].some(
              (source) => chunk?.documentId === source.documentId && chunk.section === source.section
            ),
        }
      }),
    }
  }
  const rows: Awaited<ReturnType<typeof retrieveExample>>[] = []
  for (let offset = 0; offset < examples.length; offset += 4) {
    rows.push(...(await Promise.all(examples.slice(offset, offset + 4).map((example, index) => retrieveExample(example, offset + index)))))
  }
  function evaluate(split: string, cutoff: number, retrievalCutoff: number) {
    const selected = rows.filter((row) => row.split === split)
    const matches = selected.flatMap((row) => row.matches.filter((match) => match.score >= cutoff && match.retrievalScore >= retrievalCutoff))
    const positives = selected.filter((row) => row.documentId !== null)
    const found = positives.filter((row) => row.matches.some((match) => match.score >= cutoff && match.retrievalScore >= retrievalCutoff && match.correct)).length
    const precision = matches.length ? matches.filter((match) => match.correct).length / matches.length : 0
    const recall = positives.length ? found / positives.length : 0
    const unsupported = selected.filter((row) => row.documentId === null && row.matches.some((match) => match.score >= cutoff && match.retrievalScore >= retrievalCutoff)).length
    return {
      precision,
      recall,
      unsupported,
      f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    }
  }
  const scores = [...new Set(rows.filter((row) => row.split === 'validation').flatMap((row) => row.matches.map((match) => match.score)))].sort((a, b) => a - b)
  if (!scores.length) throw new Error('Vector mutations are not visible or no validation matches were found')
  const retrievalScores = [...new Set(rows.filter((row) => row.split === 'validation').flatMap((row) => row.matches.map((match) => match.retrievalScore)))].sort((a, b) => a - b)
  const candidates = [Math.max(...scores) + Number.EPSILON, ...scores].flatMap((cutoff) =>
    retrievalScores.map((retrievalCutoff) => ({ cutoff, retrievalCutoff, ...evaluate('validation', cutoff, retrievalCutoff) }))
  )
  candidates.sort((a, b) => b.cutoff - a.cutoff || b.precision - a.precision || b.recall - a.recall || b.retrievalCutoff - a.retrievalCutoff)
  const eligible = candidates.filter((candidate) => candidate.precision >= 0.9 && candidate.recall >= 0.75 && candidate.unsupported === 0)
  const chosen = eligible[0] ?? candidates[0]
  const test = evaluate('test', chosen.cutoff, chosen.retrievalCutoff)
  const passed = chosen.precision >= 0.9 && chosen.recall >= 0.75 && test.precision >= 0.9 && test.recall >= 0.75 && test.unsupported === 0
  const report = {
    versionId,
    rerankerModel,
    retrievalPolicy,
    calibrationRule: 'Highest support cutoff that meets validation precision, recall, and rejection limits.',
    minimumScore: chosen.cutoff,
    minimumRetrievalScore: chosen.retrievalCutoff,
    validation: chosen,
    test,
    passed,
    rows,
    scope: 'Retrieval only. Generation and source use require native chat evidence.',
  }
  const evidence = new URL('../../../.local/verification/rag/', import.meta.url)
  await mkdir(evidence, { recursive: true })
  await writeFile(new URL(`${versionId}.json`, evidence), JSON.stringify(report, null, 2) + '\n')
  if (passed)
    await getDb()
      .update(knowledgeIndexVersions)
      .set({ state: 'verified', minimumScore: chosen.cutoff, minimumRetrievalScore: chosen.retrievalCutoff, error: null })
      .where(eq(knowledgeIndexVersions.id, versionId))
  console.log(
    JSON.stringify({
      versionId,
      minimumScore: chosen.cutoff,
      minimumRetrievalScore: chosen.retrievalCutoff,
      validation: chosen,
      test,
      passed,
      activated: false,
    })
  )
  if (!passed) process.exitCode = 1
} finally {
  await closeDb()
}
