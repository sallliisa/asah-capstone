import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod/v4'
import { closeDb, getDb } from '../src/db'
import { CloudflareError, cloudflareRequest, embedTexts, embeddingDimensions, embeddingModel, upsertVectors } from '../src/knowledge/cloudflare'
import { knowledgeChunks, knowledgeDocuments, knowledgeIndexVersions } from '../src/routes/(authenticated)/knowledge/knowledge.table'

const hash = (text: string) => createHash('sha256').update(text).digest('hex')
const directory = new URL('../knowledge/guides/', import.meta.url)
const sources = await Promise.all(
  (await readdir(directory))
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map(async (filename) => {
      const text = (await readFile(new URL(filename, directory), 'utf8')).replace(/\r\n/g, '\n')
      const title = /^# (.+)$/m.exec(text)?.[1]
      if (!title) throw new Error(`Missing guide title: ${filename}`)
      return { id: filename.slice(0, -3), title, area: 'guidance', path: `knowledge/guides/${filename}`, contentHash: hash(text), text }
    })
)
if (!sources.length) throw new Error('No guide sources were found')
const indexName = z
  .string()
  .min(1)
  .parse(process.env.VECTORIZE_INDEX_NAME ?? 'kos-de-mansion-guidance')
const versionId = hash(JSON.stringify({ sources, indexName, embeddingModel, embeddingDimensions }))
try {
  const existing = (await getDb().select().from(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, versionId)))[0]
  if (existing?.state === 'active' || existing?.state === 'verified') {
    console.log(JSON.stringify({ versionId, state: existing.state, unchanged: true }))
  } else {
    const chunks = sources.flatMap((source) => {
      const sections = source.text.split(/^## /m).slice(1)
      return sections.flatMap((section, sectionIndex) => {
        const newline = section.indexOf('\n')
        const heading = section.slice(0, newline).trim()
        const words = section
          .slice(newline + 1)
          .trim()
          .split(/\s+/)
        return Array.from({ length: Math.ceil(words.length / 220) }, (_, index) => {
          const position = index * 220
          const passage = words.slice(position, position + 250).join(' ')
          if (!passage) throw new Error('Empty source section')
          const id = hash(`${versionId}:${source.id}:${sectionIndex}:${position}`)
          return {
            id,
            vectorId: id,
            versionId,
            documentId: source.id,
            title: source.title,
            area: source.area,
            section: heading,
            ordinal: sectionIndex * 10000 + position,
            text: passage,
            contentHash: hash(passage),
          }
        })
      })
    })
    if (!chunks.length) throw new Error('No passages were found')
    const probe = await embedTexts([chunks[0].text])
    if (probe[0].length !== embeddingDimensions) throw new Error('Embedding dimension mismatch')
    const path = `/vectorize/v2/indexes/${encodeURIComponent(indexName)}`
    try {
      const index = z.object({ config: z.object({ dimensions: z.number(), metric: z.string() }) }).parse(await cloudflareRequest(path))
      if (index.config.dimensions !== embeddingDimensions || index.config.metric !== 'cosine') throw new Error('Incompatible Vectorize index')
    } catch (error) {
      if (!(error instanceof CloudflareError) || error.status !== 404) throw error
      await cloudflareRequest('/vectorize/v2/indexes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: indexName, config: { dimensions: embeddingDimensions, metric: 'cosine' } }),
      })
    }
    const metadata = z.object({ metadataIndexes: z.array(z.object({ propertyName: z.string(), indexType: z.string() })).optional() }).parse(await cloudflareRequest(`${path}/metadata_index/list`))
    for (const propertyName of ['corpusVersion', 'area']) {
      const found = metadata.metadataIndexes?.find((entry) => entry.propertyName === propertyName)
      if (found && found.indexType !== 'string') throw new Error('Incompatible metadata index')
      if (!found)
        await cloudflareRequest(`${path}/metadata_index/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyName, indexType: 'string' }) })
    }
    await getDb().transaction(async (tx) => {
      await tx.insert(knowledgeIndexVersions).values({ id: versionId, embeddingModel, dimensions: embeddingDimensions, indexName }).onConflictDoNothing()
      for (const source of sources) {
        const values = { id: source.id, title: source.title, area: source.area, path: source.path, contentHash: source.contentHash }
        await tx.insert(knowledgeDocuments).values(values).onConflictDoUpdate({ target: knowledgeDocuments.id, set: values })
      }
      await tx.insert(knowledgeChunks).values(chunks).onConflictDoNothing()
    })
    try {
      for (let index = 0; index < chunks.length; index += 20) {
        const batch = chunks.slice(index, index + 20)
        const vectors = await embedTexts(batch.map((chunk) => `${chunk.title}\n${chunk.section}\n${chunk.text}`))
        await upsertVectors(
          indexName,
          batch.map((chunk, row) => ({ id: chunk.vectorId, values: vectors[row], metadata: { corpusVersion: versionId, area: chunk.area } }))
        )
      }
      await getDb()
        .update(knowledgeIndexVersions)
        .set({ state: 'indexed', error: null })
        .where(and(eq(knowledgeIndexVersions.id, versionId), ne(knowledgeIndexVersions.state, 'active')))
      console.log(JSON.stringify({ versionId, documents: sources.length, passages: chunks.length, state: 'indexed', activation: 'Run knowledge:verify after Vectorize mutations are visible.' }))
    } catch (error) {
      await getDb()
        .update(knowledgeIndexVersions)
        .set({ state: 'failed', error: 'ingestion_failed' })
        .where(and(eq(knowledgeIndexVersions.id, versionId), ne(knowledgeIndexVersions.state, 'active')))
      throw error
    }
  }
} finally {
  await closeDb()
}
