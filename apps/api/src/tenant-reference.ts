import { z } from 'zod/v4'
import { and, asc, eq } from 'drizzle-orm'
import { getDb } from './db'
import { roleAssignments, roles } from './routes/(authenticated)/roles/roles.table'
import { users } from './routes/(authenticated)/users/users.table'

export function readTenants(id?: string) {
  return getDb().selectDistinct({ id: users.id, name: users.name }).from(users)
    .innerJoin(roleAssignments, eq(roleAssignments.userId, users.id))
    .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
    .where(and(eq(roles.roleCode, 'occupant'), id ? eq(users.id, id) : undefined))
    .orderBy(asc(users.name))
}

export async function validateTenant(value: unknown) {
  const parsed = z.string().min(1).nullish().safeParse(value)
  if (!parsed.success) return { field: 'tenantId', message: 'Select an existing tenant.' }
  const id = parsed.data
  if (id && !(await readTenants(id)).length) return { field: 'tenantId', message: 'Select an existing tenant.' }
}
