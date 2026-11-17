import { and, eq, inArray, or } from 'drizzle-orm'
import { getDb } from '../db'
import { knowledgeChunks, knowledgeIndexVersions } from '../routes/(authenticated)/knowledge/knowledge.table'
import { embedTexts, embeddingDimensions, embeddingModel, queryVectors } from './cloudflare'

export async function retrieveGuidance(question: string, area: string) {
  const active = (
    await getDb()
      .select()
      .from(knowledgeIndexVersions)
      .where(and(eq(knowledgeIndexVersions.state, 'active'), eq(knowledgeIndexVersions.embeddingModel, embeddingModel)))
  )[0]
  if (!active) return { status: 'not-indexed', passages: [] }
  if (active.minimumScore === null) return { status: 'uncalibrated', passages: [] }
  const minimumScore = active.minimumScore
  if (active.dimensions !== embeddingDimensions) return { status: 'incompatible-index', passages: [] }
  try {
    const vector = (await embedTexts([question]))[0]
    const matches = (await queryVectors({ indexName: active.indexName, vector, versionId: active.id, area })).filter((match) => match.score >= minimumScore)
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
    return {
      status: chunks.length ? 'ok' : 'no-match',
      passages: matches.flatMap((match) => {
        const chunk = chunks.find((candidate) => candidate.vectorId === match.id)
        return chunk ? [{ documentId: chunk.documentId, title: chunk.title, section: chunk.section, version: active.id, passageId: chunk.id, text: chunk.text, score: match.score }] : []
      }),
    }
  } catch {
    return { status: 'unavailable', passages: [] }
  }
}
