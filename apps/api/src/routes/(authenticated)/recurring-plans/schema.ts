import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { z } from 'zod/v4'
import { recurringPlans } from './recurring-plans.table'

export const intervalUnitSchema = z.enum(['day', 'week', 'month'])
const financialKindSchema = z.enum(['none', 'income', 'expense'])
const fields = {
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).nullable().default(null),
  roomId: z.string().min(1).nullable().default(null),
  startDate: z.iso.date(),
  intervalCount: z.number().int().min(1).max(366).default(1),
  intervalUnit: intervalUnitSchema.default('week'),
  active: z.boolean().default(true),
  financialKind: financialKindSchema.default('none'),
  categoryId: z.string().trim().min(1).default('activity-category-general'),
  amount: z.number().int().positive().max(2147483647).nullable().default(null),
}
const omitted = { id: true, occurrenceIndex: true, nextOccurrenceDate: true, createdByUserId: true, updatedByUserId: true, createdAt: true, updatedAt: true } as const
function validatePlan(value: { financialKind: string; categoryId: string; amount: number | null }, context: z.RefinementCtx) {
  if (value.financialKind === 'none') {
    if (value.amount !== null) context.addIssue({ code: 'custom', path: ['amount'], message: 'A plan without financial details has no amount.' })
  }
}

export const recurringPlanCreateSchema = createInsertSchema(recurringPlans).omit(omitted).extend(fields).superRefine(validatePlan)
export const recurringPlanUpdateSchema = createUpdateSchema(recurringPlans).omit(omitted).extend({ name: fields.name, startDate: fields.startDate, description: fields.description.removeDefault(), roomId: fields.roomId.removeDefault(), intervalCount: fields.intervalCount.removeDefault(), intervalUnit: fields.intervalUnit.removeDefault(), active: fields.active.removeDefault(), financialKind: fields.financialKind.removeDefault(), categoryId: fields.categoryId.removeDefault(), amount: fields.amount.removeDefault() }).partial()
export const recurringPlanSelectSchema = createSelectSchema(recurringPlans).extend({ intervalUnit: intervalUnitSchema, financialKind: financialKindSchema })
export const recurringPlanStateSchema = recurringPlanSelectSchema.superRefine(validatePlan)
export const recurringPlanPublicSchema = recurringPlanSelectSchema.extend({ roomName: z.string().nullable(), categoryName: z.string() })

export const upcomingPlanSchema = z.object({
  planId: z.string(), name: z.string(), roomName: z.string().nullable(), categoryName: z.string(),
  expectedDate: z.iso.date(), financialKind: financialKindSchema, amount: z.number().nullable(),
})
