import { createEntity } from '@southneuhof/sprindle/entity'
import { issueReports } from './issue-reports.table'
import { issueReportCreateSchema, issueReportSelectSchema, issueReportUpdateSchema } from './schema'

export const issueReport = createEntity({
  table: issueReports,
  schemas: { create: issueReportCreateSchema, update: issueReportUpdateSchema, select: issueReportSelectSchema },
})
