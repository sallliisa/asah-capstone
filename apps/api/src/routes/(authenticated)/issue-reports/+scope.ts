import { defineScope } from '@southneuhof/sprindle'
import { requireOrgIdentity } from '../../../identity'
import { issueReport } from './issue-reports.entity'
import { readIssueReport } from './read'
import { issueReportPublicSchema } from './schema'

export default defineScope({
  entity: issueReport,
  enrich: {
    schema: issueReportPublicSchema,
    run: async (record, args) => readIssueReport(record.id, await requireOrgIdentity(args)),
  },
})
