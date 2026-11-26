import { forbidden, update, validationError } from '@southneuhof/sprindle'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../../../../../db'
import { requireOrgIdentity, requirePermission } from '../../../../../identity'
import { activities } from '../../../activities/activities.table'
import { issueReports } from '../../issue-reports.table'
import { canViewReportActivities, reportActivityScope } from '../../read'
import { issueReportUpdateSchema } from '../../schema'

export const PATCH = update({
  authorize: requirePermission('manage-issue-reports'),
  run: async (args) => {
    const actor = await requireOrgIdentity(args)
    const { activityId, status } = issueReportUpdateSchema.parse(args.state.input)
    const where = eq(issueReports.id, args.state.id)
    return getDb().transaction(async (tx) => {
      const [original] = await tx.select().from(issueReports).where(where).for('update')
      if (!original) return undefined
      if (activityId !== undefined && activityId !== original.activityId) {
        if (!canViewReportActivities(actor)) throw forbidden('Activity access is required to change the link.')
        if (activityId !== null) {
          const [activity] = await tx.select({ id: activities.id }).from(activities)
            .where(and(eq(activities.id, activityId), reportActivityScope(original.roomId))).for('update')
          if (!activity) throw validationError([{ field: 'activityId', message: 'Select a corrective repair for this room.' }])
        }
      }
      const [record] = await tx.update(issueReports).set({ status, activityId, updatedAt: new Date().toISOString() }).where(where).returning()
      return record
    })
  },
})
