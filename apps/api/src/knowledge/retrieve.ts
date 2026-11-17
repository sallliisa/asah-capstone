import { and, eq, inArray, or } from 'drizzle-orm'
import { getDb } from '../db'
import { knowledgeChunks, knowledgeIndexVersions } from '../routes/(authenticated)/knowledge/knowledge.table'
import { embedTexts, embeddingDimensions, embeddingModel, queryVectors } from './cloudflare'

import { candidateLimit, rankGuidance, rerankerModel, retrievalPolicy } from './rank'

export async function retrieveGuidance(question: string, area: string) {
  const active = (
    await getDb()
      .select()
      .from(knowledgeIndexVersions)
      .where(and(eq(knowledgeIndexVersions.state, 'active'), eq(knowledgeIndexVersions.embeddingModel, embeddingModel)))
  )[0]
  if (!active) return { status: 'not-indexed', passages: [] }
  if (active.minimumScore === null || active.minimumRetrievalScore === null) return { status: 'uncalibrated', passages: [] }
  const minimumScore = active.minimumScore
  const minimumRetrievalScore = active.minimumRetrievalScore
  if (active.dimensions !== embeddingDimensions || active.rerankerModel !== rerankerModel || active.retrievalPolicy !== retrievalPolicy) return { status: 'incompatible-index', passages: [] }
  try {
    const vector = (await embedTexts([question]))[0]
    const matches = await queryVectors({
      indexName: active.indexName,
      vector,
      versionId: active.id,
      area,
      topK: candidateLimit,
    })
    if (!matches.length) return { status: 'no-match', passages: [] }
    const chunks = await getDb()
      .select()
      .from(knowledgeChunks)
      .where(
        and(
          eq(knowledgeChunks.versionId, active.id),
          or(eq(knowledgeChunks.area, area), eq(knowledgeChunks.area, 'guidance')),
          inArray(
            knowledgeChunks.vectorId,
            matches.map((match) => match.id)
          )
        )
      )
    const candidates = matches.flatMap((match) => {
      const chunk = chunks.find((chunk) => chunk.vectorId === match.id)
      return chunk ? [{ id: match.id, title: chunk.title, section: chunk.section, text: chunk.text, vectorScore: match.score }] : []
    })
    const ranked = (await rankGuidance(question, candidates)).filter((match) => match.score >= minimumScore && match.retrievalScore >= minimumRetrievalScore)
    return {
      status: ranked.length ? 'ok' : 'no-match',
      passages: ranked.flatMap((match) => {
        const chunk = chunks.find((candidate) => candidate.vectorId === match.id)
        return chunk
          ? [
              {
                documentId: chunk.documentId,
                title: chunk.title,
                section: chunk.section,
                version: active.id,
                passageId: chunk.id,
                text: chunk.text,
                score: match.score,
                retrievalScore: match.retrievalScore,
              },
            ]
          : []
      }),
    }
  } catch {
    return { status: 'unavailable', passages: [] }
  }
}
