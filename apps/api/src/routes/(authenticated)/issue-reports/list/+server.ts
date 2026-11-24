import { defineRoute } from '@southneuhof/sprindle'
import { and, count, desc, eq, ilike } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requireOrgIdentity, requirePermission } from '../../../../identity'
import { issueReports } from '../issue-reports.table'
import { issueReportReadQuery, issueReportReadScope } from '../read'
import { issueReportListQuerySchema } from '../schema'

export const GET = defineRoute({
  authorize: requirePermission('view-issue-reports'),
  action: async (args) => {
    const actor = await requireOrgIdentity(args)
    const { page, limit, search, status } = issueReportListQuerySchema.parse(args.c.req.query())
    const where = and(
      issueReportReadScope(actor),
      search ? ilike(issueReports.title, `%${search}%`) : undefined,
      status ? eq(issueReports.status, status) : undefined,
    )
    const [data, total] = await Promise.all([
      issueReportReadQuery(actor).where(where).orderBy(desc(issueReports.createdAt), desc(issueReports.id)).limit(limit).offset((page - 1) * limit),
      getDb().select({ value: count() }).from(issueReports).where(where),
    ])
    return { data, total: total[0].value, page, limit }
  },
})
