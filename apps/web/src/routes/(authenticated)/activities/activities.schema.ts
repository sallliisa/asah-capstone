import {
  activityCreateSchema,
  activityEditSchema,
  activityPublicSchema,
  financialKindSchema,
  paymentStatusSchema,
  workStatusSchema,
} from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import { z } from 'zod/v4'
import { collectionQueryFields } from '@/framework/hono/collectionQuery'
import { rpc } from '@/framework/rpc'
import { checkedHonoCreateSchema, checkedHonoRecordSchema, checkedHonoUpdateSchema } from '@/framework/schema'

export const activitiesRecordSchema = checkedHonoRecordSchema(rpc.activities, activityPublicSchema)

const draftFields = {
  name: activityCreateSchema.shape.name,
  description: activityCreateSchema.shape.description,
  categoryId: activityCreateSchema.shape.categoryId,
  roomId: activityCreateSchema.shape.roomId,
  tenantId: activityCreateSchema.shape.tenantId,
  financialKind: activityCreateSchema.shape.financialKind,
  amount: z.number().nullable().default(null),
  paymentDate: activityCreateSchema.shape.paymentDate,
  receipt: activityPublicSchema.shape.receipt.default(null),
}

const createDraft = z.object({
  ...draftFields,
  dueDate: activityCreateSchema.shape.dueDate.nullable(),
  taskTarget: activityCreateSchema.shape.taskTarget,
})

function createInput({ dueDate, taskTarget, ...draft }: z.output<typeof createDraft>, context: z.RefinementCtx, scheduled: boolean) {
  const value = {
    ...draft,
    amount: draft.financialKind === 'none' ? null : draft.amount,
    paymentDate: scheduled || draft.financialKind === 'none' ? null : (draft.paymentDate ?? activityToday()),
    receipt: scheduled || draft.financialKind === 'none' ? null : draft.receipt,
    ...(scheduled ? { dueDate: dueDate ?? undefined, taskTarget: draft.financialKind === 'none' ? undefined : taskTarget } : {}),
  }
  const result = activityCreateSchema.safeParse(value)
  if (!result.success) {
    for (const issue of result.error.issues) context.addIssue({ code: 'custom', message: issue.message, path: issue.path })
    return z.NEVER
  }
  return value
}

const createDraftSchema = createDraft.transform((draft, context) => createInput(draft, context, false))
const scheduleDraftSchema = createDraft.refine((draft) => Boolean(draft.dueDate), { path: ['dueDate'], message: 'Enter a due date.' }).transform((draft, context) => createInput(draft, context, true))

const updateDraftSchema = z
  .object({
    ...draftFields,
    tenantId: activityEditSchema.shape.tenantId,
    workStatus: workStatusSchema,
    tenantNote: activityEditSchema.shape.tenantNote,
    paymentStatus: paymentStatusSchema.nullable().default(null),
    dueDate: activityEditSchema.shape.dueDate,
    taskTarget: activityEditSchema.shape.taskTarget,
  })
  .transform((draft, context) => {
    const value = {
      ...draft,
      amount: draft.financialKind === 'none' ? null : draft.amount,
      paymentStatus: draft.financialKind === 'none' ? null : draft.paymentStatus,
      paymentDate: draft.financialKind !== 'none' && draft.paymentStatus === 'settled' ? (draft.paymentDate ?? activityToday()) : null,
      receipt: draft.financialKind === 'none' ? null : draft.receipt,
      taskTarget: draft.taskTarget && draft.financialKind === 'none' ? ('work' as const) : draft.taskTarget,
    }
    const result = activityEditSchema.safeParse(value)
    if (!result.success) {
      for (const issue of result.error.issues) context.addIssue({ code: 'custom', message: issue.message, path: issue.path })
      return z.NEVER
    }
    return value
  })

export const activitiesCreateSchema = checkedHonoCreateSchema(rpc.activities, createDraftSchema)
export const activitiesScheduleSchema = checkedHonoCreateSchema(rpc.activities, scheduleDraftSchema)
export const activitiesUpdateSchema = checkedHonoUpdateSchema(rpc.activities, updateDraftSchema)

const optionalFilter = z
  .string()
  .nullish()
  .transform((value) => value || undefined)
export const activitiesQuerySchema = z.object({
  ...collectionQueryFields,
  sort_by: z.enum(['name', 'dueDate', 'occurrenceDate', 'paymentDate', 'amount', 'createdAt']).optional(),
  financialOnly: z.union([z.boolean(), z.enum(['true', 'false']).transform((value) => value === 'true')]).optional(),
  financialKind: financialKindSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  workStatus: workStatusSchema.optional(),
  roomId: z.string().optional(),
  tenantId: z.string().optional(),
  categoryId: z.string().optional(),
  paymentFrom: z.iso.date().optional(),
  paymentTo: z.iso.date().optional(),
})
export const activitiesListQuerySchema = activitiesQuerySchema.omit({ financialOnly: true }).extend({
  openTasks: z.literal('true').optional(),
})

export const activityFiltersSchema = z
  .object({
    financialKind: optionalFilter,
    paymentStatus: optionalFilter,
    workStatus: optionalFilter,
    roomId: optionalFilter,
    tenantId: optionalFilter,
    categoryId: optionalFilter,
    paymentFrom: optionalFilter,
    paymentTo: optionalFilter,
    openTasks: z
      .literal('true')
      .or(z.literal(''))
      .nullish()
      .transform((value) => value || undefined),
  })
  .transform((values, context) => {
    const result = activitiesListQuerySchema.safeParse(values)
    if (!result.success) {
      for (const issue of result.error.issues) context.addIssue({ code: 'custom', message: issue.message, path: issue.path })
      return z.NEVER
    }
    return result.data
  })

export function activityToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function activityCreateInitialData(preset: unknown) {
  if (preset === 'expense') {
    const today = activityToday()
    return { financialKind: 'expense', paymentDate: today } as const
  }
  return { financialKind: 'none' } as const
}
