import { validationError } from '@southneuhof/sprindle'
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { activityCategories } from '../../activity-categories/activity-categories.table'
import { rooms } from '../../rooms/rooms.table'
import { activities } from '../activities.table'
import { businessDate } from '../dates'
import { activityDueDate, openActivityTask } from '../query'
import { activityDashboardSchema, activityDashboardQuerySchema } from '../schema'

export async function readCashDashboard(query: ReturnType<typeof activityDashboardQuerySchema.parse>) {
  const today = businessDate()
  const anchor = new Date(`${today.slice(0, 7)}-01T00:00:00.000Z`)
  let periodStart = `${today.slice(0, 7)}-01`
  let periodEnd = today
  if (query.period === 'last-month') {
    anchor.setUTCDate(0)
    periodEnd = anchor.toISOString().slice(0, 10)
    periodStart = `${periodEnd.slice(0, 7)}-01`
  } else if (query.period === 'last-three-months') {
    anchor.setUTCMonth(anchor.getUTCMonth() - 2)
    periodStart = anchor.toISOString().slice(0, 10)
  } else if (query.period === 'custom') {
    if (!query.from || !query.to) throw validationError('Select both custom dates.')
    periodStart = query.from
    periodEnd = query.to > today ? today : query.to
    if (periodStart > periodEnd) throw validationError('The start date must be on or before the end date and today.')
  }
  const [cash, pending, counts, upcoming] = await Promise.all([
    getDb()
      .select({
        id: activities.id,
        name: activities.name,
        date: activities.paymentDate,
        kind: activities.financialKind,
        amount: activities.amount,
        categoryId: activities.categoryId,
        categoryName: activityCategories.name,
        roomId: activities.roomId,
        roomName: rooms.roomCode,
      })
      .from(activities)
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .leftJoin(rooms, eq(activities.roomId, rooms.id))
      .where(
        and(eq(activities.paymentStatus, 'settled'), gte(activities.paymentDate, periodStart), lte(activities.paymentDate, periodEnd), query.roomId ? eq(activities.roomId, query.roomId) : undefined)
      ),
    getDb()
      .select({
        id: activities.id,
        name: activities.name,
        roomName: rooms.roomCode,
        categoryName: activityCategories.name,
        financialKind: activities.financialKind,
        workStatus: activities.workStatus,
        paymentStatus: activities.paymentStatus,
        expectedDate: activityDueDate,
        taskTarget: activities.taskTarget,
        amount: activities.amount,
      })
      .from(activities)
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .leftJoin(rooms, eq(activities.roomId, rooms.id))
      .where(openActivityTask)
      .orderBy(sql`${activityDueDate} asc nulls last`, asc(activities.id))
      .limit(8),
    getDb()
      .select({ total: sql<number>`count(*)::int` })
      .from(activities)
      .where(openActivityTask),
    getDb()
      .select({
        id: activities.id,
        name: activities.name,
        roomName: rooms.roomCode,
        expectedDate: activityDueDate,
        financialKind: activities.financialKind,
        amount: activities.amount,
      })
      .from(activities)
      .leftJoin(rooms, eq(activities.roomId, rooms.id))
      .where(and(openActivityTask, gte(activityDueDate, today)))
      .orderBy(asc(activityDueDate), asc(activities.id))
      .limit(8),
  ])
  const firstDay = new Date(`${periodStart}T00:00:00.000Z`).getTime()
  const finalDay = new Date(`${periodEnd}T00:00:00.000Z`).getTime()
  const daily = Array.from({ length: Math.round((finalDay - firstDay) / 86400000) + 1 }, (_, index) => ({
    date: new Date(firstDay + index * 86400000).toISOString().slice(0, 10),
    income: 0,
    expenses: 0,
    net: 0,
    cumulativeNet: 0,
  }))
  const dailyByDate = new Map(daily.map((day) => [day.date, day]))
  const categories = new Map<string, { id: string; name: string; amount: number }>()
  const roomGroups = new Map<string | null, { id: string | null; name: string; amount: number; activities: { id: string; name: string; amount: number }[] }>()
  let income = 0
  let expenses = 0
  for (const row of cash) {
    if (!row.date || row.amount === null) continue
    const day = dailyByDate.get(row.date)
    if (!day) continue
    if (row.kind === 'income') {
      income += row.amount
      day.income += row.amount
    } else if (row.kind === 'expense') {
      expenses += row.amount
      day.expenses += row.amount
      const category = categories.get(row.categoryId) ?? { id: row.categoryId, name: row.categoryName, amount: 0 }
      category.amount += row.amount
      categories.set(row.categoryId, category)
      const room = roomGroups.get(row.roomId) ?? { id: row.roomId, name: row.roomName ?? 'Shared', amount: 0, activities: [] }
      room.activities.push({ id: row.id, name: row.name, amount: row.amount })
      room.amount += row.amount
      roomGroups.set(row.roomId, room)
    }
  }
  let cumulativeNet = 0
  for (const day of daily) {
    day.net = day.income - day.expenses
    cumulativeNet += day.net
    day.cumulativeNet = cumulativeNet
  }
  const attention = pending.map((row) => ({ ...row, overdue: row.expectedDate !== null && row.expectedDate < today }))
  const byAmount = (a: { amount: number; name: string }, b: { amount: number; name: string }) => b.amount - a.amount || a.name.localeCompare(b.name)
  const snapshot = activityDashboardSchema.parse({
    today,
    periodStart,
    periodEnd,
    roomId: query.roomId ?? null,
    income,
    expenses,
    net: income - expenses,
    daily,
    expensesByCategory: [...categories.values()].sort(byAmount),
    expensesByRoom: [...roomGroups.values()].sort(byAmount),
    attention: { total: counts[0]?.total ?? 0, items: attention },
    upcoming,
  })
  return snapshot
}
