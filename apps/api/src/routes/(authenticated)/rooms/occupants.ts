import { and, asc, eq } from 'drizzle-orm'
import { getDb } from '../../../db'
import { roleAssignments, roles } from '../roles/roles.table'
import { users } from '../users/users.table'

export function readOccupants(id?: string) {
  return getDb().selectDistinct({ id: users.id, name: users.name }).from(users)
    .innerJoin(roleAssignments, eq(roleAssignments.userId, users.id))
    .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
    .where(and(eq(roles.roleCode, 'occupant'), eq(roles.active, true), eq(roleAssignments.active, true), id ? eq(users.id, id) : undefined))
    .orderBy(asc(users.name))
}
