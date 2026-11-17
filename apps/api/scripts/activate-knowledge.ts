import { readFile } from 'node:fs/promises'
import { and, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod/v4'
import { closeDb, getDb } from '../src/db'
import { embeddingDimensions, embeddingModel } from '../src/knowledge/cloudflare'
import { rerankerModel, retrievalPolicy } from '../src/knowledge/rank'
import { knowledgeIndexVersions } from '../src/routes/(authenticated)/knowledge/knowledge.table'

const [versionId] = z.tuple([z.string().regex(/^[a-f0-9]{64}$/)]).parse(process.argv.slice(2))
try {
  const report = z
    .object({
      versionId: z.literal(versionId),
      passed: z.literal(true),
      rerankerModel: z.literal(rerankerModel),
      retrievalPolicy: z.literal(retrievalPolicy),
      minimumScore: z.number().finite(),
      minimumRetrievalScore: z.number().finite(),
    })
    .parse(JSON.parse(await readFile(new URL(`../../../.local/verification/rag/${versionId}.json`, import.meta.url), 'utf8')))
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('kos-knowledge-activate'))`)
    const candidate = (await tx.select().from(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, versionId)).for('update'))[0]
    if (
      !candidate ||
      !['verified', 'active'].includes(candidate.state) ||
      candidate.embeddingModel !== embeddingModel ||
      candidate.dimensions !== embeddingDimensions ||
      candidate.rerankerModel !== rerankerModel ||
      candidate.retrievalPolicy !== retrievalPolicy ||
      candidate.minimumScore !== report.minimumScore ||
      candidate.minimumRetrievalScore !== report.minimumRetrievalScore
    )
      throw new Error('Candidate does not match the passing verification report')
    if (candidate.state === 'active') return
    await tx
      .update(knowledgeIndexVersions)
      .set({ state: 'retired' })
      .where(and(eq(knowledgeIndexVersions.embeddingModel, embeddingModel), eq(knowledgeIndexVersions.state, 'active'), ne(knowledgeIndexVersions.id, versionId)))
    await tx.update(knowledgeIndexVersions).set({ state: 'active', activatedAt: new Date().toISOString() }).where(eq(knowledgeIndexVersions.id, versionId))
  })
  console.log(JSON.stringify({ versionId, activated: true, verification: 'Saved passing report; no model or retrieval calls repeated.' }))
} finally {
  await closeDb()
}
