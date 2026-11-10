import { defineRoute } from '@southneuhof/sprindle'
import { and, asc, desc, eq, gte, lte, or, sql } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { activityCategories } from '../../activity-categories/activity-categories.table'
import { rooms } from '../../rooms/rooms.table'
import { activities } from '../activities.table'
import { businessDate } from '../dates'
import { activityDashboardSchema } from '../schema'

export const GET = defineRoute({
  authorize: requirePermission('view-activities'),
  action: async () => {
    const today = businessDate()
    const monthStart = `${today.slice(0, 7)}-01`
    const end = new Date(`${monthStart}T00:00:00.000Z`)
    end.setUTCMonth(end.getUTCMonth() + 1, 0)
    const monthEnd = end.toISOString().slice(0, 10)
    const openWork = or(eq(activities.workStatus, 'planned'), eq(activities.workStatus, 'in_progress'))
    const draftMoney = and(sql`${activities.financialKind} <> 'none'`, eq(activities.paymentStatus, 'draft'))
    const needsAttention = or(openWork, draftMoney)
    const overdue = sql<boolean>`coalesce(${activities.occurrenceDate} < ${today} and ((${activities.financialKind} = 'none' and ${openWork}) or (${draftMoney})), false)`
    const [cash, pending, counts] = await Promise.all([
      getDb().select({ id: activities.id, name: activities.name, date: activities.paymentDate, kind: activities.financialKind, amount: activities.amount, categoryId: activities.categoryId, categoryName: activityCategories.name, roomId: activities.roomId, roomName: rooms.roomCode }).from(activities)
        .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id)).leftJoin(rooms, eq(activities.roomId, rooms.id))
        .where(and(eq(activities.paymentStatus, 'settled'), gte(activities.paymentDate, monthStart), lte(activities.paymentDate, today))),
      getDb().select({ id: activities.id, name: activities.name, roomName: rooms.roomCode, categoryName: activityCategories.name, financialKind: activities.financialKind, workStatus: activities.workStatus, paymentStatus: activities.paymentStatus, expectedDate: activities.occurrenceDate, amount: activities.amount }).from(activities)
        .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id)).leftJoin(rooms, eq(activities.roomId, rooms.id))
        .where(needsAttention).orderBy(desc(overdue), asc(sql`coalesce(${activities.occurrenceDate}, '9999-12-31'::date)`), asc(activities.id)).limit(8),
      getDb().select({ total: sql<number>`count(*)::int` }).from(activities).where(needsAttention),
    ])
    const daily = Array.from({ length: Number(today.slice(8)) }, (_, index) => ({ date: `${today.slice(0, 7)}-${String(index + 1).padStart(2, '0')}`, income: 0, expenses: 0, net: 0, cumulativeNet: 0 }))
    const categories = new Map<string, { id: string; name: string; amount: number }>()
    const roomGroups = new Map<string | null, { id: string | null; name: string; amount: number; activities: { id: string; name: string; amount: number }[] }>()
    let income = 0
    let expenses = 0
    for (const row of cash) {
      if (!row.date || row.amount === null) continue
      const day = daily[Number(row.date.slice(8)) - 1]
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
    const attention = pending.map((row) => ({ ...row, overdue: row.expectedDate !== null && row.expectedDate < today && (row.financialKind === 'none' ? row.workStatus === 'planned' || row.workStatus === 'in_progress' : row.paymentStatus === 'draft') }))
      .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.expectedDate ?? '9999').localeCompare(b.expectedDate ?? '9999') || a.id.localeCompare(b.id))
    const byAmount = (a: { amount: number; name: string }, b: { amount: number; name: string }) => b.amount - a.amount || a.name.localeCompare(b.name)
    const snapshot = activityDashboardSchema.parse({ today, monthStart, monthEnd, income, expenses, net: income - expenses, daily, expensesByCategory: [...categories.values()].sort(byAmount), expensesByRoom: [...roomGroups.values()].sort(byAmount), attention: { total: counts[0]?.total ?? 0, items: attention } })
    return { data: [snapshot], total: 1 }
  },
})
