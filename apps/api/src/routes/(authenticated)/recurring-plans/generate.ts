import { and, asc, eq, lte } from 'drizzle-orm'
import { z } from 'zod/v4'
import { getDb } from '../../../db'
import { activities } from '../activities/activities.table'
import { businessDate } from '../activities/dates'
import { recurringPlans } from './recurring-plans.table'
import { intervalUnitSchema, recurringPlanSelectSchema } from './schema'

export function occurrenceDate(startDate: string, intervalCount: number, intervalUnit: z.output<typeof intervalUnitSchema>, index: number): string {
  const date = new Date(`${startDate}T00:00:00.000Z`)
  if (intervalUnit === 'month') {
    const day = date.getUTCDate()
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + intervalCount * index)
    const end = new Date(date)
    end.setUTCMonth(end.getUTCMonth() + 1, 0)
    date.setUTCDate(Math.min(day, end.getUTCDate()))
  } else date.setUTCDate(date.getUTCDate() + intervalCount * index * (intervalUnit === 'week' ? 7 : 1))
  return z.iso.date().parse(date.toISOString().slice(0, 10))
}


export async function generateDueActivities(asOfDate = businessDate()) {
  const through = z.iso.date().parse(asOfDate)
  const due = await getDb().select({ id: recurringPlans.id }).from(recurringPlans)
    .where(and(eq(recurringPlans.active, true), lte(recurringPlans.nextOccurrenceDate, through))).orderBy(asc(recurringPlans.id))
  let generated = 0
  for (const candidate of due) {
    generated += await getDb().transaction(async (tx) => {
      const row = (await tx.select().from(recurringPlans).where(and(eq(recurringPlans.id, candidate.id), eq(recurringPlans.active, true))).for('update', { skipLocked: true }))[0]
      if (!row) return 0
      const plan = recurringPlanSelectSchema.parse(row)
      let index = plan.occurrenceIndex
      let scheduledDate = plan.nextOccurrenceDate
      let count = 0
      for (let step = 0; step < 100 && scheduledDate <= through; step += 1) {
        const inserted = await tx.insert(activities).values({
          name: plan.name,
          description: plan.description,
          roomId: plan.roomId,
          workStatus: 'planned',
          financialKind: plan.financialKind,
          categoryId: plan.categoryId,
          amount: plan.amount,
          paymentStatus: plan.financialKind === 'none' ? null : 'draft',
          recurringPlanId: plan.id,
          occurrenceDate: scheduledDate,
          createdByUserId: plan.createdByUserId,
          updatedByUserId: plan.updatedByUserId,
        }).onConflictDoNothing({ target: [activities.recurringPlanId, activities.occurrenceDate] }).returning({ id: activities.id })
        count += inserted.length
        index += 1
        scheduledDate = occurrenceDate(plan.startDate, plan.intervalCount, plan.intervalUnit, index)
      }
      await tx.update(recurringPlans).set({ occurrenceIndex: index, nextOccurrenceDate: scheduledDate, updatedAt: new Date().toISOString() }).where(eq(recurringPlans.id, plan.id))
      return count
    })
  }
  return { generated }
}

export function startRecurringActivityWorker() {
  let running = false
  const run = async () => {
    if (running) return
    running = true
    try {
      await generateDueActivities()
    } catch (error) {
      console.error('Recurring activity generation failed.', error)
    } finally {
      running = false
    }
  }
  void run()
  const timer = setInterval(() => { void run() }, 60_000)
  timer.unref()
  return () => clearInterval(timer)
}
