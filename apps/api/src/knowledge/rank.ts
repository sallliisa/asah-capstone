import { z } from 'zod/v4'
import { cloudflareRequest } from './cloudflare'

export const rerankerModel = '@cf/baai/bge-reranker-base'
export const retrievalPolicy = 'hybrid-bm25-075-reranker-v2'
export const candidateLimit = 16

const stopwords = new Set(
  'apa apakah bagaimana yang dan atau untuk dari di ke pada dengan itu ini nya saya ada sudah belum bisa dapat berapa kapan siapa mengapa bila jika saat agar harus boleh tentang sebuah paling saja dalam'.split(
    ' '
  )
)
const tokenize = (text: string) => (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => !stopwords.has(word))

export async function rankGuidance(question: string, candidates: { id: string; title: string; section: string; text: string; vectorScore: number }[]) {
  if (!candidates.length) return []
  const documents = candidates.map((candidate) => tokenize(`${candidate.title} ${candidate.section} ${candidate.text}`))
  const averageLength = documents.reduce((total, words) => total + words.length, 0) / documents.length
  const frequencies = new Map<string, number>()
  for (const words of documents) for (const word of new Set(words)) frequencies.set(word, (frequencies.get(word) ?? 0) + 1)
  const query = new Set(tokenize(question))
  const ranked = candidates
    .map((candidate, index) => {
      const words = documents[index]
      const counts = new Map<string, number>()
      for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1)
      let lexical = 0
      for (const word of query) {
        const count = counts.get(word) ?? 0
        if (!count) continue
        const frequency = frequencies.get(word) ?? 0
        const inverseFrequency = Math.log(1 + (documents.length - frequency + 0.5) / (frequency + 0.5))
        lexical += (inverseFrequency * count * 2.2) / (count + 1.2 * (0.25 + (0.75 * words.length) / averageLength))
      }
      return { candidate, score: 0.75 * candidate.vectorScore + (0.25 * lexical) / (lexical + 5) }
    })
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
  const selected = ranked[0].candidate
  const result = z.object({ response: z.array(z.object({ id: z.literal(0), score: z.number().finite().min(0).max(1) })).length(1) }).parse(
    await cloudflareRequest(`/ai/run/${rerankerModel}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question, contexts: [{ text: selected.text }], top_k: 1 }),
    })
  )
  return [{ id: selected.id, score: result.response[0].score, retrievalScore: ranked[0].score }]
}
