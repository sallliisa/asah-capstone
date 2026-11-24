import type { CollectionLoadContext } from '@southneuhof/loom'
import { issueReportListQuerySchema } from '@southneuhof/api/src/routes/(authenticated)/issue-reports/schema.ts'
import { createHonoResourceActions, parseHonoResponse } from '@/framework/hono'
import { rpc } from '@/framework/rpc'

const reports = rpc['issue-reports']
const commands = createHonoResourceActions({
  detail: reports.detail,
  create: reports.create,
  update: reports.update,
  rooms: reports.rooms,
  'repair-activities': reports['repair-activities'],
})

export const issueReportActions = {
  detail: commands.detail,
  create: commands.create,
  update: commands.update,
  rooms: commands.rooms,
  'repair-activities': commands['repair-activities'],
  async list({ query: input, signal }: CollectionLoadContext<(typeof issueReportListQuerySchema)['_output']>) {
    const { page, limit, search, status } = issueReportListQuerySchema.parse(input)
    const response = await reports.list.$get({ query: { page: String(page), limit: String(limit), search, status } }, { init: { signal } })
    const { data, total } = await parseHonoResponse<typeof reports.list.$get>(response)
    return { data, meta: { total } }
  },
}
