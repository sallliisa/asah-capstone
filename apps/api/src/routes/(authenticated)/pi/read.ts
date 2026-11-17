import { forbidden } from '@southneuhof/sprindle'
import { and, asc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod/v4'
import type { OrgIdentity } from '../../../authorization'
import type { PermissionCode } from '../../../authorization/catalog'
import { getDb } from '../../../db'
import { activities } from '../activities/activities.table'
import { activityQuerySchema, activityWhere, activityOrder } from '../activities/query'
import { readCashDashboard } from '../activities/dashboard/projection'
import { activityDashboardQuerySchema } from '../activities/schema'
import { rooms } from '../rooms/rooms.table'
import { users } from '../users/users.table'
import { recurringPlans } from '../recurring-plans/recurring-plans.table'
import { readTenantAssessment } from '../tenant-detector/projection'
import { businessDate } from '../activities/dates'

const pageFields = { limit: z.number().int().min(1).max(100).default(25), page: z.number().int().positive().default(1) }
const filterFields = { tenantId: z.string().min(1).optional(), roomId: z.string().min(1).optional(), search: z.string().max(160).optional() }
const readRequestSchema = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('rooms'), ...pageFields, ...filterFields }).strict(),
  z
    .object({
      operation: z.literal('activities'),
      ...pageFields,
      ...filterFields,
      categoryId: z.string().optional(),
      financialKind: z.enum(['none', 'income', 'expense']).optional(),
      paymentStatus: z.enum(['draft', 'settled']).optional(),
      paymentFrom: z.iso.date().optional(),
      paymentTo: z.iso.date().optional(),
    })
    .strict(),
  z.object({ operation: z.literal('schedules'), ...pageFields, ...filterFields }).strict(),
  activityDashboardQuerySchema.extend({ operation: z.literal('finances') }).strict(),
  z.object({ operation: z.literal('tenant-assessment'), tenantId: z.string().min(1) }).strict(),
])
export const piReadSchema = z.object({ request: readRequestSchema }).strict()

function requireRead(owner: OrgIdentity, ...codes: PermissionCode[]) {
  for (const code of codes) if (!owner.permissions.has(code)) throw forbidden(`Missing permission "${code}".`)
}

export async function readAppData(owner: OrgIdentity, input: z.output<typeof readRequestSchema>) {
  const today = businessDate()
  if (input.operation === 'finances') {
    requireRead(owner, 'view-activities')
    return readCashDashboard(activityDashboardQuerySchema.parse(input))
  }
  if (input.operation === 'tenant-assessment') {
    requireRead(owner, 'view-users', 'view-activities')
    return readTenantAssessment(input.tenantId)
  }
  if (input.operation === 'rooms') {
    requireRead(owner, 'view-rooms', 'view-users')
    const data = await getDb()
      .select({ id: rooms.id, roomCode: rooms.roomCode, name: rooms.name, occupantId: rooms.occupantId, occupantName: users.name })
      .from(rooms)
      .leftJoin(users, eq(users.id, rooms.occupantId))
      .where(
        and(
          input.roomId ? eq(rooms.id, input.roomId) : undefined,
          input.tenantId ? eq(rooms.occupantId, input.tenantId) : undefined,
          input.search ? or(ilike(rooms.roomCode, `%${input.search}%`), ilike(rooms.name, `%${input.search}%`), ilike(users.name, `%${input.search}%`)) : undefined
        )
      )
      .orderBy(asc(rooms.roomCode), asc(rooms.id))
      .limit(input.limit)
      .offset((input.page - 1) * input.limit)
    return { asOfDate: today, data, page: input.page, limit: input.limit }
  }
  if (input.operation === 'schedules') {
    requireRead(owner, 'view-recurring-plans')
    if (input.tenantId) requireRead(owner, 'view-users')
    const data = await getDb()
      .select({
        id: recurringPlans.id,
        name: recurringPlans.name,
        roomId: recurringPlans.roomId,
        tenantId: recurringPlans.tenantId,
        categoryId: recurringPlans.categoryId,
        startDate: recurringPlans.startDate,
        nextOccurrenceDate: recurringPlans.nextOccurrenceDate,
        intervalCount: recurringPlans.intervalCount,
        intervalUnit: recurringPlans.intervalUnit,
        active: recurringPlans.active,
      })
      .from(recurringPlans)
      .where(
        and(
          eq(recurringPlans.active, true),
          input.roomId ? eq(recurringPlans.roomId, input.roomId) : undefined,
          input.tenantId ? eq(recurringPlans.tenantId, input.tenantId) : undefined,
          input.search ? ilike(recurringPlans.name, `%${input.search}%`) : undefined
        )
      )
      .orderBy(asc(recurringPlans.nextOccurrenceDate), asc(recurringPlans.id))
      .limit(input.limit)
      .offset((input.page - 1) * input.limit)
    return { asOfDate: today, data: data.map((plan) => ({ ...plan, generationPending: plan.nextOccurrenceDate <= today })), page: input.page, limit: input.limit }
  }
  requireRead(owner, 'view-activities')
  if (input.tenantId) requireRead(owner, 'view-users')
  const filters = {
    page: input.page,
    limit: input.limit,
    search: input.search,
    roomId: input.roomId,
    tenantId: input.tenantId,
    categoryId: input.categoryId,
    financialKind: input.financialKind,
    paymentStatus: input.paymentStatus,
    paymentFrom: input.paymentFrom,
    paymentTo: input.paymentTo,
  }
  const query = activityQuerySchema.parse(filters)
  const data = await getDb()
    .select({
      id: activities.id,
      name: activities.name,
      roomId: activities.roomId,
      tenantId: activities.tenantId,
      categoryId: activities.categoryId,
      workStatus: activities.workStatus,
      completedDate: activities.completedDate,
      financialKind: activities.financialKind,
      amount: activities.amount,
      paymentStatus: activities.paymentStatus,
      paymentDate: activities.paymentDate,
      occurrenceDate: activities.occurrenceDate,
    })
    .from(activities)
    .where(activityWhere(query))
    .orderBy(...activityOrder(query))
    .limit(input.limit)
    .offset((input.page - 1) * input.limit)
  return { asOfDate: today, data, page: input.page, limit: input.limit }
}
