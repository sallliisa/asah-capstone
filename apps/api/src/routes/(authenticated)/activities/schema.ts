import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { z } from 'zod/v4'
import { storedAssetInput, storedAssetSchema } from '../../../schema'
import { activities } from './activities.table'

export const workStatusSchema = z.enum(['planned', 'in_progress', 'completed', 'cancelled'])
export const financialKindSchema = z.enum(['none', 'income', 'expense'])
export const paymentStatusSchema = z.enum(['draft', 'settled'])
export const activityDateSchema = z.iso.date()
const text = z.string().trim().max(4000).nullable()
const write = {
  name: z.string().trim().min(1).max(160),
  description: text.default(null),
  roomId: z.string().min(1).nullable().default(null),
  workStatus: workStatusSchema.default('planned'),
  financialKind: financialKindSchema.default('none'),
  categoryId: z.string().trim().min(1).default('activity-category-general'),
  amount: z.number().int().positive().max(2147483647).nullable().default(null),
  paymentStatus: paymentStatusSchema.nullable().default(null),
  paymentDate: activityDateSchema.nullable().default(null),
  receipt: storedAssetInput.nullable().default(null),
}
const omitted = {
  id: true,
  completedDate: true,
  recurringPlanId: true,
  occurrenceDate: true,
  createdByUserId: true,
  updatedByUserId: true,
  createdAt: true,
  updatedAt: true,
} as const

type FinanceState = {
  financialKind: string
  categoryId: string
  amount: number | null
  paymentStatus: string | null
  paymentDate: string | null
  receipt: unknown
}
function validateFinancialState(value: FinanceState, context: z.RefinementCtx) {
  if (value.financialKind === 'none') {
    for (const key of ['amount', 'paymentStatus', 'paymentDate', 'receipt'] as const) {
      if (value[key] !== null)
        context.addIssue({
          code: 'custom',
          path: [key],
          message: 'An activity without financial details cannot contain payment values.',
        })
    }
  } else {
    if (!value.paymentStatus)
      context.addIssue({
        code: 'custom',
        path: ['paymentStatus'],
        message: 'Select a payment status.',
      })
    if (value.paymentStatus === 'settled' && value.amount === null)
      context.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'A settled payment requires an amount.',
      })
    if (value.paymentStatus === 'draft' && value.paymentDate !== null)
      context.addIssue({
        code: 'custom',
        path: ['paymentDate'],
        message: 'A draft has no payment date.',
      })
  }
}

export const activityInsertSchema = createInsertSchema(activities)
export const activityCreateSchema = activityInsertSchema.omit({ ...omitted, workStatus: true, paymentStatus: true }).extend({
  name: write.name,
  description: write.description,
  roomId: write.roomId,
  categoryId: write.categoryId,
  financialKind: write.financialKind,
  amount: write.amount,
  paymentDate: write.paymentDate,
  receipt: write.receipt,
}).strict().superRefine((value, context) => {
  validateFinancialState({ ...value, paymentStatus: value.financialKind === 'none' ? null : 'settled' }, context)
})
export const activityUpdateSchema = createUpdateSchema(activities)
  .omit(omitted)
  .extend({
    name: write.name,
    description: write.description.removeDefault(),
    roomId: write.roomId.removeDefault(),
    workStatus: write.workStatus.removeDefault(),
    financialKind: write.financialKind.removeDefault(),
    categoryId: write.categoryId.removeDefault(),
    amount: write.amount.removeDefault(),
    paymentStatus: write.paymentStatus.removeDefault(),
    paymentDate: write.paymentDate.removeDefault(),
    receipt: write.receipt.removeDefault(),
  })
  .partial()
  .strict()
export const activitySelectSchema = createSelectSchema(activities).extend({
  workStatus: workStatusSchema,
  financialKind: financialKindSchema,
  paymentStatus: paymentStatusSchema.nullable(),
})
export const activityStateSchema = activitySelectSchema.superRefine((value, context) => {
  validateFinancialState(value, context)
  if (value.paymentStatus === 'settled' && !value.paymentDate)
    context.addIssue({
      code: 'custom',
      path: ['paymentDate'],
      message: 'A settled payment requires a payment date.',
    })
  if (value.workStatus === 'completed' && !value.completedDate)
    context.addIssue({
      code: 'custom',
      path: ['completedDate'],
      message: 'Enter the completion date.',
    })
  if (value.workStatus !== 'completed' && value.completedDate !== null)
    context.addIssue({
      code: 'custom',
      path: ['completedDate'],
      message: 'Only completed activities have a completion date.',
    })
})
export const activityPublicSchema = activitySelectSchema.extend({
  roomName: z.string().nullable(), categoryName: z.string(),
  receipt: storedAssetSchema.nullable(),
  planName: z.string().nullable(),
})
export type ActivityRecord = z.output<typeof activitySelectSchema>

export const activityDashboardSchema = z.object({
  today: z.iso.date(),
  monthStart: z.iso.date(),
  monthEnd: z.iso.date(),
  income: z.number(),
  expenses: z.number(),
  net: z.number(),
  daily: z.array(z.object({ date: z.iso.date(), income: z.number(), expenses: z.number(), net: z.number(), cumulativeNet: z.number() })),
  expensesByCategory: z.array(z.object({ id: z.string(), name: z.string(), amount: z.number() })),
  expensesByRoom: z.array(z.object({ id: z.string().nullable(), name: z.string(), amount: z.number(), activities: z.array(z.object({ id: z.string(), name: z.string(), amount: z.number() })) })),
  attention: z.object({
    total: z.number().int().nonnegative(),
    items: z.array(z.object({
      id: z.string(), name: z.string(), roomName: z.string().nullable(), categoryName: z.string(),
      financialKind: financialKindSchema, workStatus: workStatusSchema, paymentStatus: paymentStatusSchema.nullable(),
      expectedDate: z.iso.date().nullable(), amount: z.number().nullable(), overdue: z.boolean(),
    })),
  }),
})
