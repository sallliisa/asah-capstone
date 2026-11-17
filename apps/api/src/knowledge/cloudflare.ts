import { z } from 'zod/v4'

export const embeddingModel = '@cf/baai/bge-m3'
export const embeddingDimensions = 1024

export class CloudflareError extends Error {
  constructor(readonly status: number) {
    super(`cloudflare_http_${status}`)
  }
}

export async function cloudflareRequest(path: string, init: RequestInit = {}) {
  const accountId = z
    .string()
    .regex(/^[a-f0-9]{32}$/i)
    .parse(process.env.CLOUDFLARE_ACCOUNT_ID)
  const token = z.string().min(1).parse(process.env.CLOUDFLARE_API_TOKEN)
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, ...init.headers },
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new CloudflareError(response.status)
  const body = z.object({ success: z.literal(true), result: z.unknown() }).parse(await response.json())
  return body.result
}

export async function embedTexts(texts: string[]) {
  const body = await cloudflareRequest(`/ai/run/${embeddingModel}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: texts }) })
  const result = z.object({ data: z.array(z.array(z.number().finite()).length(embeddingDimensions)) }).parse(body)
  if (result.data.length !== texts.length) throw new Error('embedding_count_mismatch')
  return result.data
}

export async function queryVectors(input: { indexName: string; vector: number[]; versionId: string; area: string; topK?: number }) {
  const result = await cloudflareRequest(`/vectorize/v2/indexes/${encodeURIComponent(input.indexName)}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vector: input.vector,
      topK: input.topK ?? 3,
      filter: { corpusVersion: input.versionId, area: { $in: [...new Set([input.area, 'guidance'])] } },
      returnValues: false,
      returnMetadata: 'none',
    }),
  })
  return z.object({ matches: z.array(z.object({ id: z.string(), score: z.number().finite() })) }).parse(result).matches
}

export async function upsertVectors(indexName: string, rows: { id: string; values: number[]; metadata: { corpusVersion: string; area: string } }[]) {
  const body = rows.map((row) => JSON.stringify(row)).join('\n') + '\n'
  await cloudflareRequest(`/vectorize/v2/indexes/${encodeURIComponent(indexName)}/upsert`, { method: 'POST', headers: { 'Content-Type': 'application/x-ndjson' }, body })
}
