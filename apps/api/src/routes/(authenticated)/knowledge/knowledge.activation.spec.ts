import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { eq } from 'drizzle-orm'
import { expect, it } from 'vitest'
import { closeDb, getDb } from '../../../db'
import { embeddingDimensions, embeddingModel } from '../../../knowledge/cloudflare'
import { rerankerModel, retrievalPolicy } from '../../../knowledge/rank'
import { knowledgeIndexVersions } from './knowledge.table'

it('keeps unverified knowledge unpublished and activates only the matching verified version', async () => {
  const id = randomBytes(32).toString('hex')
  const directory = resolve('../../.local/verification/rag')
  const report = resolve(directory, `${id}.json`)
  await mkdir(directory, { recursive: true })
  try {
    await getDb().insert(knowledgeIndexVersions).values({ id, embeddingModel, dimensions: embeddingDimensions, rerankerModel, retrievalPolicy, indexName: 'activation-fixture', state: 'indexed', minimumScore: 0.8, minimumRetrievalScore: 0.5 })
    await writeFile(report, JSON.stringify({ versionId: id, passed: true, rerankerModel, retrievalPolicy, minimumScore: 0.8, minimumRetrievalScore: 0.5 }))
    const rejected = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/activate-knowledge.ts', id], { encoding: 'utf8' })
    expect(rejected.status).not.toBe(0)
    expect(rejected.stderr).toContain('Candidate does not match the passing verification report')
    expect((await getDb().select().from(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, id)))[0].state).toBe('indexed')
    await getDb().update(knowledgeIndexVersions).set({ state: 'verified' }).where(eq(knowledgeIndexVersions.id, id))
    const accepted = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/activate-knowledge.ts', id], { encoding: 'utf8' })
    expect(accepted.status).toBe(0)
    const published = (await getDb().select().from(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, id)))[0]
    expect(published.state).toBe('active')
    expect(published.activatedAt).not.toBeNull()
  } finally {
    await getDb().delete(knowledgeIndexVersions).where(eq(knowledgeIndexVersions.id, id))
    await rm(report, { force: true })
    await closeDb()
  }
})
