import { z } from 'zod/v4'
import { and, asc, eq, or, sql } from 'drizzle-orm'
import { getDb } from './db'
import { roleAssignments, roles } from './routes/(authenticated)/roles/roles.table'
import { activities } from './routes/(authenticated)/activities/activities.table'
import { recurringPlans } from './routes/(authenticated)/recurring-plans/recurring-plans.table'
import { users } from './routes/(authenticated)/users/users.table'

export function readTenants(id?: string) {
  return getDb().selectDistinct({ id: users.id, name: users.name }).from(users)
    .leftJoin(roleAssignments, eq(roleAssignments.userId, users.id))
    .leftJoin(roles, eq(roles.id, roleAssignments.roleId))
    .where(and(or(eq(roles.roleCode, 'occupant'), sql`exists (select 1 from ${activities} where ${activities.tenantId} = ${users.id})`, sql`exists (select 1 from ${recurringPlans} where ${recurringPlans.tenantId} = ${users.id})`), id ? eq(users.id, id) : undefined))
    .orderBy(asc(users.name))
}

export async function validateTenant(value: unknown) {
  const parsed = z.string().min(1).nullish().safeParse(value)
  if (!parsed.success) return { field: 'tenantId', message: 'Select an existing tenant.' }
  const id = parsed.data
  if (id && !(await readTenants(id)).length) return { field: 'tenantId', message: 'Select an existing tenant.' }
}
