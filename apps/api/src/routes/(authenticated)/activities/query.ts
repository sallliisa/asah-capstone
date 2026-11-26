import { and, asc, desc, eq, gte, ilike, isNull, lte, ne, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod/v4'
import { activities } from './activities.table'
import { financialKindSchema, paymentStatusSchema, workStatusSchema } from './schema'

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(10),
  search: z.string().optional(),
  sort: z.enum(['name', 'dueDate', 'occurrenceDate', 'paymentDate', 'amount', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  financialOnly: z.enum(['true', 'false']).transform((value) => value === 'true').or(z.boolean()).optional(),
  openTasks: z.enum(['true', 'false']).transform((value) => value === 'true').or(z.boolean()).optional(),
  financialKind: financialKindSchema.optional(),
  workStatus: workStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  tenantId: z.string().min(1).optional(),
  roomId: z.string().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  paymentFrom: z.iso.date().optional(),
  paymentTo: z.iso.date().optional(),
}).strict().refine((value) => !value.paymentFrom || !value.paymentTo || value.paymentFrom <= value.paymentTo, { path: ['paymentTo'], message: 'The end date must not precede the start date.' })

export const activityDueDate = sql<string | null>`coalesce(${activities.dueDate}, ${activities.occurrenceDate})`

const openWork = or(eq(activities.workStatus, 'planned'), eq(activities.workStatus, 'in_progress'))
const draftPayment = eq(activities.paymentStatus, 'draft')
export const openActivityTask = and(ne(activities.workStatus, 'cancelled'), or(
  and(eq(activities.taskTarget, 'work'), openWork),
  and(eq(activities.taskTarget, 'payment'), draftPayment),
  and(isNull(activities.taskTarget), or(openWork, draftPayment)),
))

export function activityWhere(query: z.output<typeof activityQuerySchema>, scope?: SQL) {
  return and(scope,
    query.search ? or(ilike(activities.name, `%${query.search}%`), ilike(activities.description, `%${query.search}%`)) : undefined,
    query.financialOnly ? ne(activities.financialKind, 'none') : undefined,
    query.openTasks ? openActivityTask : undefined,
    query.financialKind ? eq(activities.financialKind, query.financialKind) : undefined,
    query.workStatus ? eq(activities.workStatus, query.workStatus) : undefined,
    query.paymentStatus ? eq(activities.paymentStatus, query.paymentStatus) : undefined,
    query.tenantId ? eq(activities.tenantId, query.tenantId) : undefined,
    query.roomId ? eq(activities.roomId, query.roomId) : undefined,
    query.categoryId ? eq(activities.categoryId, query.categoryId) : undefined,
    query.paymentFrom ? gte(activities.paymentDate, query.paymentFrom) : undefined,
    query.paymentTo ? lte(activities.paymentDate, query.paymentTo) : undefined)
}

export function activityOrder(query: z.output<typeof activityQuerySchema>) {
  const column = query.sort === 'dueDate' ? activityDueDate : activities[query.sort]
  const order = query.order === 'desc' ? desc(column) : asc(column)
  return [query.sort === 'dueDate' ? sql`${order} nulls last` : order, asc(activities.id)]
}
