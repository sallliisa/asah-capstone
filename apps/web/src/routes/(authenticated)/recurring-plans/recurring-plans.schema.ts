import { recurringPlanCreateSchema, recurringPlanPublicSchema } from '@southneuhof/api/src/routes/(authenticated)/recurring-plans/schema.ts'
import { z } from 'zod/v4'
import { collectionQueryFields } from '@/framework/hono/collectionQuery'
import { rpc } from '@/framework/rpc'
import { checkedHonoCreateSchema, checkedHonoRecordSchema, checkedHonoUpdateSchema } from '@/framework/schema'

export const recurringPlansRecordSchema = checkedHonoRecordSchema(rpc['recurring-plans'], recurringPlanPublicSchema)
const draft = z
  .object({
    name: recurringPlanCreateSchema.shape.name,
    description: recurringPlanCreateSchema.shape.description,
    roomId: recurringPlanCreateSchema.shape.roomId,
    startDate: recurringPlanCreateSchema.shape.startDate,
    intervalCount: recurringPlanCreateSchema.shape.intervalCount,
    intervalUnit: recurringPlanCreateSchema.shape.intervalUnit,
    active: recurringPlanCreateSchema.shape.active,
    financialKind: recurringPlanCreateSchema.shape.financialKind,
    categoryId: recurringPlanCreateSchema.shape.categoryId,
    amount: z.number().nullable().default(null),
  })
  .transform((draft, context) => {
    const value = { ...draft, amount: draft.financialKind === 'none' ? null : draft.amount }
    const result = recurringPlanCreateSchema.safeParse(value)
    if (!result.success) {
      for (const issue of result.error.issues) context.addIssue({ code: 'custom', message: issue.message, path: issue.path })
      return z.NEVER
    }
    return value
  })
export const recurringPlansCreateSchema = checkedHonoCreateSchema(rpc['recurring-plans'], draft)
export const recurringPlansUpdateSchema = checkedHonoUpdateSchema(rpc['recurring-plans'], draft)
export const recurringPlansQuerySchema = z.object({ ...collectionQueryFields, sort_by: z.enum(['name', 'nextOccurrenceDate', 'startDate', 'createdAt']).optional() })
