import { afterAll, expect, it, vi } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { modelRequest } from '../../../model-service'
import { activities } from '../activities/activities.table'
import { rooms } from '../rooms/rooms.table'
import { knowledgeChunks, knowledgeDocuments, knowledgeIndexVersions } from '../knowledge/knowledge.table'
import { queryVectors } from '../../../knowledge/cloudflare'
import { rerankerModel, retrievalPolicy } from '../../../knowledge/rank'
import { piRoutingEvents } from './pi.table'
import { rolePermissions } from '../roles/roles.table'

vi.mock('../../../model-service', () => ({ modelRequest: vi.fn().mockResolvedValue({ status: 'routed', intent: 'finances', confidence: 0.9, margin: 0.8, modelVersion: 'external-intent-test' }) }))
vi.mock('../../../knowledge/cloudflare', () => ({ embeddingModel: '@cf/baai/bge-m3', embeddingDimensions: 1024, embedTexts: vi.fn().mockResolvedValue([Array(1024).fill(0)]), queryVectors: vi.fn(), cloudflareRequest: vi.fn().mockResolvedValue({ response: [{ id: 0, score: 0.9 }] }) }))
const versionIds: string[] = []
const documentIds: string[] = []
const savedEmail = process.env.CARTA_ADMIN_EMAIL
const activityIds: string[] = []
const roomIds: string[] = []
const ownerIds: string[] = []

afterAll(async () => {
  if (savedEmail === undefined) delete process.env.CARTA_ADMIN_EMAIL
  else process.env.CARTA_ADMIN_EMAIL = savedEmail
  if (versionIds.length) await getDb().delete(knowledgeChunks).where(inArray(knowledgeChunks.versionId, versionIds))
  if (versionIds.length) await getDb().delete(knowledgeIndexVersions).where(inArray(knowledgeIndexVersions.id, versionIds))
  if (documentIds.length) await getDb().delete(knowledgeDocuments).where(inArray(knowledgeDocuments.id, documentIds))
  if (ownerIds.length) await getDb().delete(piRoutingEvents).where(inArray(piRoutingEvents.ownerId, ownerIds))
  if (activityIds.length) await getDb().delete(activities).where(inArray(activities.id, activityIds))
  if (roomIds.length) await getDb().delete(rooms).where(inArray(rooms.id, roomIds))
  await closeDb()
})

const textResult = z.object({ content: z.array(z.object({ type: z.literal('text'), text: z.string() })), isError: z.boolean().optional() })

it('routes through a model-selected private context and applies the configured owner read permissions through the public test MCP', async () => {
  const owner = await createSystemSession(['view-activities', 'create-activities'], 'pi-tools-owner')
  ownerIds.push(owner.userId)
  const other = await createSystemSession(['view-activities'], 'pi-tools-other')
  process.env.CARTA_ADMIN_EMAIL = `${owner.userId}@example.invalid`
  const room = (
    await getDb()
      .insert(rooms)
      .values({ roomCode: crypto.randomUUID().slice(0, 20), name: 'Pi cash room' })
      .returning()
  )[0]
  roomIds.push(room.id)
  const created = await app.request('/activities/create', {
    method: 'POST',
    headers: { cookie: owner.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pi recorded income', roomId: room.id, financialKind: 'income', amount: 1234 }),
  })
  expect(created.status).toBe(201)
  const record = z.object({ data: z.object({ id: z.string(), paymentDate: z.string() }) }).parse(await created.json()).data
  activityIds.push(record.id)
  expect(
    (await app.request('/pi/context', { method: 'POST', headers: { cookie: other.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'Berapa biaya perbaikan?' }) })).status
  ).toBe(403)
  const client = new Client({ name: 'kos-business-proof', version: '1.0.0' })
  const transport = new StreamableHTTPClientTransport(new URL('http://localhost/pi-tools'), {
    fetch: async (input, init) => app.fetch(new Request(input, init)),
  })
  try {
    await client.connect(transport)
    const forbiddenDocument = textResult.parse(await client.callTool({ name: 'getQuestionContext', arguments: { question: 'Berapa biaya perbaikan?', document: 'rooms' } }))
    expect(forbiddenDocument.isError).toBe(true)
    const routed = textResult.parse(await client.callTool({ name: 'getQuestionContext', arguments: { question: 'Berapa biaya perbaikan?' } }))
    const context = z
      .object({ status: z.literal('routed'), prediction: z.object({ intent: z.literal('finances') }), document: z.object({ id: z.literal('finances'), content: z.string().min(100) }) })
      .parse(JSON.parse(routed.content[0].text))
    expect(context.document.id).toBe('finances')
    expect(await getDb().select().from(piRoutingEvents).where(eq(piRoutingEvents.ownerId, owner.userId))).toHaveLength(1)
    const result = textResult.parse(
      await client.callTool({ name: 'readAppData', arguments: { request: { operation: 'finances', period: 'custom', from: record.paymentDate, to: record.paymentDate, roomId: room.id } } })
    )
    expect(JSON.parse(result.content[0].text)).toMatchObject({ income: 1234, expenses: 0, net: 1234 })
    const write = textResult.parse(await client.callTool({ name: 'readAppData', arguments: { request: { operation: 'update-activity', id: record.id, amount: 999 } } }))
    expect(write.isError).toBe(true)
    expect((await getDb().select().from(activities).where(eq(activities.id, record.id)))[0].amount).toBe(1234)
    await getDb().delete(rolePermissions).where(eq(rolePermissions.roleId, owner.roleId))
    const denied = textResult.parse(await client.callTool({ name: 'readAppData', arguments: { request: { operation: 'finances', period: 'this-month' } } }))
    expect(denied.isError).toBe(true)
    vi.mocked(modelRequest).mockResolvedValueOnce({ status: 'uncertain', intent: null, confidence: 0.3, margin: 0.01, modelVersion: 'external-intent-test' })
    const uncertain = textResult.parse(await client.callTool({ name: 'getQuestionContext', arguments: { question: 'Bisa lihat rekap kas?' } }))
    const unclear = JSON.parse(uncertain.content[0].text)
    expect(unclear.status).toBe('uncertain')
    expect(unclear.message).toBe('Rekap untuk periode mana yang ingin Anda lihat?')
    expect(unclear.document).toBeUndefined()
  } finally {
    await client.close()
  }
})

it('returns passages only from the active corpus and permitted area even when the vector provider returns other matches', async () => {
  const owner = await createSystemSession([], 'pi-rag-owner')
  ownerIds.push(owner.userId)
  process.env.CARTA_ADMIN_EMAIL = `${owner.userId}@example.invalid`
  const activeId = crypto.randomUUID()
  const candidateId = crypto.randomUUID()
  versionIds.push(activeId, candidateId)
  const documentId = crypto.randomUUID()
  documentIds.push(documentId)
  await getDb().insert(knowledgeDocuments).values({ id: documentId, title: 'Published guide', area: 'guidance', path: 'fixture-guide.md', contentHash: 'fixture-hash' })
  await getDb()
    .insert(knowledgeIndexVersions)
    .values([
      { id: activeId, embeddingModel: '@cf/baai/bge-m3', rerankerModel, retrievalPolicy, dimensions: 1024, indexName: 'fixture-index', state: 'active', minimumScore: 0.75, minimumRetrievalScore: 0.25 },
      { id: candidateId, embeddingModel: '@cf/baai/bge-m3', rerankerModel, retrievalPolicy, dimensions: 1024, indexName: 'fixture-index', state: 'indexed', minimumScore: 0.75, minimumRetrievalScore: 0.25 },
    ])
  const published = crypto.randomUUID()
  const candidate = crypto.randomUUID()
  const wrongArea = crypto.randomUUID()
  await getDb()
    .insert(knowledgeChunks)
    .values([
      {
        id: published,
        vectorId: published,
        versionId: activeId,
        documentId,
        title: 'Published guide',
        area: 'guidance',
        section: 'Payment entry',
        ordinal: 0,
        text: 'Current published guidance',
        contentHash: 'current-hash',
      },
      {
        id: candidate,
        vectorId: candidate,
        versionId: candidateId,
        documentId,
        title: 'Candidate guide',
        area: 'guidance',
        section: 'Payment entry',
        ordinal: 0,
        text: 'Unpublished candidate',
        contentHash: 'candidate-hash',
      },
      {
        id: wrongArea,
        vectorId: wrongArea,
        versionId: activeId,
        documentId,
        title: 'Other area',
        area: 'other-area',
        section: 'Other section',
        ordinal: 1,
        text: 'Outside the permitted area',
        contentHash: 'other-hash',
      },
    ])
  vi.mocked(modelRequest).mockResolvedValueOnce({ status: 'routed', intent: 'guidance', confidence: 0.9, margin: 0.8, modelVersion: 'external-intent-test' })
  vi.mocked(queryVectors).mockResolvedValueOnce([
    { id: candidate, score: 0.99 },
    { id: wrongArea, score: 0.98 },
    { id: published, score: 0.9 },
  ])
  const response = await app.request('/pi/context', {
    method: 'POST',
    headers: { cookie: owner.cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Bagaimana mencatat pembayaran?' }),
  })
  expect(response.status).toBe(200)
  const result = z
    .object({ data: z.object({ retrieval: z.object({ status: z.literal('ok'), passages: z.array(z.object({ passageId: z.string(), text: z.string() })) }) }) })
    .parse(await response.json())
  expect(result.data.retrieval.passages.map((passage) => passage.passageId)).toEqual([published])
  expect(result.data.retrieval.passages[0].text).toBe('Current published guidance')
})
