import { defineRoute, notFound } from '@southneuhof/sprindle'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { activities } from '../../activities/activities.table'
import { issueReports } from '../issue-reports.table'
import { reportActivityScope } from '../read'

export const GET = defineRoute({
  authorize: [requirePermission('manage-issue-reports'), requirePermission('view-activities')],
  action: async ({ c }) => {
    const reportId = z.string().min(1).parse(c.req.query('reportId'))
    const [report] = await getDb().select({ roomId: issueReports.roomId }).from(issueReports).where(eq(issueReports.id, reportId))
    if (!report) throw notFound()
    const data = await getDb().select({ id: activities.id, name: activities.name }).from(activities)
      .where(reportActivityScope(report.roomId)).orderBy(desc(activities.createdAt), desc(activities.id))
    return { data, total: data.length }
  },
})
