import { create, forbidden, validationError } from '@southneuhof/sprindle'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requireOrgIdentity, requirePermission } from '../../../../identity'
import { rooms } from '../../rooms/rooms.table'
import { issueReports } from '../issue-reports.table'
import { issueReportCreateSchema } from '../schema'

export const POST = create({
  authorize: requirePermission('create-issue-reports'),
  run: async (args) => {
    const actor = await requireOrgIdentity(args)
    if (!actor.roleCodes.includes('occupant')) throw forbidden('Only occupants can submit an issue report.')
    const input = issueReportCreateSchema.parse(args.state.input)
    return getDb().transaction(async (tx) => {
      const [room] = await tx.select({ id: rooms.id }).from(rooms)
        .where(and(eq(rooms.id, input.roomId), eq(rooms.occupantId, actor.userId))).for('update')
      if (!room) throw validationError([{ field: 'roomId', message: 'Select a room assigned to you.' }])
      const [record] = await tx.insert(issueReports).values({ ...input, reporterId: actor.userId }).returning()
      return record
    })
  },
})
