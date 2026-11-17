import { defineDomainPart } from '@southneuhof/sprindle/model'
import { knowledgeDocuments, knowledgeIndexVersions, knowledgeChunks } from './knowledge.table'

export const domain = defineDomainPart({ entities: [], tables: { knowledgeDocuments, knowledgeIndexVersions, knowledgeChunks } })
