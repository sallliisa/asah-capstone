import { eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { closeDb, getDb } from '../src/db'
import { cloudflareRequest } from '../src/knowledge/cloudflare'
import { knowledgeChunks, knowledgeIndexVersions } from '../src/routes/(authenticated)/knowledge/knowledge.table'

const versionId = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .parse(process.argv[2])
try {
  const version = (await getDb().select().from(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, versionId)))[0]
  if (version?.state !== 'retired') throw new Error('Only a retired corpus can be cleaned up')
  const chunks = await getDb().select({ id: knowledgeChunks.vectorId }).from(knowledgeChunks).where(eq(knowledgeChunks.versionId, versionId))
  for (let index = 0; index < chunks.length; index += 500)
    await cloudflareRequest(`/vectorize/v2/indexes/${encodeURIComponent(version.indexName)}/delete_by_ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: chunks.slice(index, index + 500).map((chunk) => chunk.id) }),
    })
  console.log(JSON.stringify({ versionId, deletionQueued: chunks.length, retained: 'Database passages and source references remain.' }))
} finally {
  await closeDb()
}
