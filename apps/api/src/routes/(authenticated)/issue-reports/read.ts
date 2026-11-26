import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '../../../db'
import type { OrgIdentity } from '../../../identity'
import { activities } from '../activities/activities.table'
import { rooms } from '../rooms/rooms.table'
import { users } from '../users/users.table'
import { issueReports } from './issue-reports.table'

const correctiveRepairsCategoryId = 'activity-category-corrective-repairs'

export function canViewReportActivities(actor: OrgIdentity) {
  return actor.permissions.has('manage-issue-reports') && actor.permissions.has('view-activities')
}

export function issueReportReadScope(actor: OrgIdentity) {
  return actor.permissions.has('manage-issue-reports') ? undefined : eq(issueReports.reporterId, actor.userId)
}

export function reportActivityScope(roomId: string) {
  return and(eq(activities.roomId, roomId), eq(activities.categoryId, correctiveRepairsCategoryId))
}

export function issueReportReadQuery(actor: OrgIdentity) {
  return getDb().select({
    id: issueReports.id,
    title: issueReports.title,
    description: issueReports.description,
    status: issueReports.status,
    roomName: sql<string>`${rooms.roomCode} || ' · ' || ${rooms.name}`,
    reporterName: users.name,
    activityId: activities.id,
    activityName: activities.name,
    createdAt: issueReports.createdAt,
    updatedAt: issueReports.updatedAt,
  }).from(issueReports)
    .innerJoin(rooms, eq(rooms.id, issueReports.roomId))
    .innerJoin(users, eq(users.id, issueReports.reporterId))
    .leftJoin(activities, canViewReportActivities(actor) ? eq(activities.id, issueReports.activityId) : sql`false`)
}

export async function readIssueReport(id: string, actor: OrgIdentity) {
  const [record] = await issueReportReadQuery(actor).where(and(eq(issueReports.id, id), issueReportReadScope(actor)))
  return record
}
