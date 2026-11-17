import { sql } from 'drizzle-orm'
import { doublePrecision, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  area: text('area').notNull(),
  path: text('path').notNull(),
  contentHash: text('content_hash').notNull(),
})
export const knowledgeIndexVersions = pgTable(
  'knowledge_index_versions',
  {
    id: text('id').primaryKey(),
    embeddingModel: text('embedding_model').notNull(),
    rerankerModel: text('reranker_model'),
    retrievalPolicy: text('retrieval_policy').notNull().default('unrecorded'),
    dimensions: integer('dimensions').notNull(),
    indexName: text('index_name').notNull(),
    state: text('state').notNull().default('preparing'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    activatedAt: timestamp('activated_at', { withTimezone: true, mode: 'string' }),
    error: text('error'),
    minimumScore: doublePrecision('minimum_score'),
    minimumRetrievalScore: doublePrecision('minimum_retrieval_score'),
  },
  (table) => [
    uniqueIndex('knowledge_one_active_model')
      .on(table.embeddingModel)
      .where(sql`${table.state} = 'active'`),
  ]
)
export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: text('id').primaryKey(),
  versionId: text('version_id')
    .notNull()
    .references(() => knowledgeIndexVersions.id, { onDelete: 'cascade' }),
  documentId: text('document_id')
    .notNull()
    .references(() => knowledgeDocuments.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  area: text('area').notNull(),
  section: text('section').notNull(),
  ordinal: integer('ordinal').notNull(),
  text: text('text').notNull(),
  contentHash: text('content_hash').notNull(),
  vectorId: text('vector_id').notNull().unique(),
})
