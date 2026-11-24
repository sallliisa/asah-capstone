import { afterAll, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { seedBoardingHouse } from '../../../../scripts/seed-boarding-house'
import { seedAuthorization } from '../../../../scripts/seed-shared'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { activities } from '../activities/activities.table'
import { roleAssignments } from '../roles/roles.table'
import { rooms } from '../rooms/rooms.table'
import { issueReports } from './issue-reports.table'
import { issueReportPublicSchema } from './schema'

const reporterIds: string[] = []
const roomIds: string[] = []
const activityIds: string[] = []

function request(path: string, method: string, cookie: string, body?: object) {
  return app.request(path, {
    method,
    headers: { cookie, 'Content-Type': 'application/json' },
    ...(body && { body: JSON.stringify(body) }),
  })
}

async function occupant(name: string) {
  const session = await createSystemSession([], name)
  reporterIds.push(session.userId)
  await getDb().insert(roleAssignments).values({ userId: session.userId, roleId: 'role-occupant' })
  return session
}

async function reportDetails(response: Response) {
  return z.object({ data: issueReportPublicSchema }).parse(await response.json()).data
}

afterAll(async () => {
  const db = getDb()
  if (reporterIds.length) await db.delete(issueReports).where(inArray(issueReports.reporterId, reporterIds))
  if (activityIds.length) await db.delete(activities).where(inArray(activities.id, activityIds))
  if (roomIds.length) await db.delete(rooms).where(inArray(rooms.id, roomIds))
  await closeDb()
})

it('keeps occupant reports private and validates the owner repair link before saving follow-up', async () => {
  await seedBoardingHouse()
  await seedAuthorization()
  const db = getDb()
  const first = await occupant('report-first')
  const second = await occupant('report-second')
  const owner = await createSystemSession(['view-issue-reports', 'manage-issue-reports', 'view-activities'], 'report-owner')
  const [firstRoom, secondRoom] = await db.insert(rooms).values([
    { roomCode: crypto.randomUUID().slice(0, 12), name: 'First room', occupantId: first.userId },
    { roomCode: crypto.randomUUID().slice(0, 12), name: 'Second room', occupantId: second.userId },
  ]).returning()
  roomIds.push(firstRoom.id, secondRoom.id)

  const submit = (cookie: string, roomId: string, title: string) => request('/issue-reports/create', 'POST', cookie, {
    roomId, title, description: 'The fixture needs repair.',
  })
  const invalid = await submit(first.cookie, secondRoom.id, 'Invalid room')
  expect(invalid.status).toBe(400)
  expect(await db.select().from(issueReports).where(eq(issueReports.reporterId, first.userId))).toEqual([])

  const created = await submit(first.cookie, firstRoom.id, 'Shower leak')
  expect(created.status).toBe(201)
  const firstReport = await reportDetails(created)
  const secondCreated = await submit(second.cookie, secondRoom.id, 'Broken door')
  expect(secondCreated.status).toBe(201)
  const secondReport = await reportDetails(secondCreated)

  await db.update(rooms).set({ occupantId: null }).where(eq(rooms.id, firstRoom.id))
  const secondList = await request('/issue-reports/list', 'GET', second.cookie)
  expect(secondList.status).toBe(200)
  const listPayload = z.object({ data: z.array(issueReportPublicSchema), total: z.number() }).parse(await secondList.json())
  expect(listPayload.total).toBe(1)
  expect(listPayload.data.map(({ id }) => id)).toEqual([secondReport.id])

  const detailPath = `/issue-reports/detail/${firstReport.id}`
  const updatePath = `/issue-reports/update/${firstReport.id}`
  expect((await request(detailPath, 'GET', second.cookie)).status).toBe(404)
  expect((await request(updatePath, 'PATCH', first.cookie, { status: 'resolved' })).status).toBe(403)
  expect((await request('/activities/list', 'GET', first.cookie)).status).toBe(403)
  const [otherRoomRepair, sameRoomRepair, sameRoomOther] = await db.insert(activities).values([
    { name: 'Other room repair', roomId: secondRoom.id, categoryId: 'activity-category-corrective-repairs' },
    { name: 'Replace shower valve', roomId: firstRoom.id, categoryId: 'activity-category-corrective-repairs' },
    { name: 'General activity', roomId: firstRoom.id },
  ]).returning()
  activityIds.push(otherRoomRepair.id, sameRoomRepair.id, sameRoomOther.id)

  const options = await request(`/issue-reports/repair-activities?reportId=${firstReport.id}`, 'GET', owner.cookie)
  expect(options.status).toBe(200)
  const choicePayload = z.object({ data: z.array(z.object({ id: z.string() })) }).parse(await options.json())
  expect(choicePayload.data).toEqual([{ id: sameRoomRepair.id }])
  expect((await request(updatePath, 'PATCH', owner.cookie, { status: 'resolved', activityId: otherRoomRepair.id })).status).toBe(400)
  expect((await db.select().from(issueReports).where(eq(issueReports.id, firstReport.id)))[0]).toMatchObject({
    status: 'open', activityId: null, roomId: firstRoom.id, reporterId: first.userId,
  })

  const updated = await request(updatePath, 'PATCH', owner.cookie, { status: 'resolved', activityId: sameRoomRepair.id })
  expect(updated.status).toBe(200)
  expect(await reportDetails(await request(detailPath, 'GET', owner.cookie))).toMatchObject({
    status: 'resolved', activityId: sameRoomRepair.id, activityName: 'Replace shower valve',
  })
  expect(await reportDetails(await request(detailPath, 'GET', first.cookie))).toMatchObject({
    status: 'resolved', activityId: null, activityName: null, roomName: `${firstRoom.roomCode} · First room`,
  })
})
