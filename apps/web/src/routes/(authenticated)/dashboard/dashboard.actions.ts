import type { CollectionLoadContext } from '@southneuhof/loom'
import { activityDashboardQuerySchema, activityDashboardSchema } from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import { z } from 'zod/v4'
import { rpc } from '@/framework/rpc'

export async function loadDashboardCash(context: CollectionLoadContext<(typeof activityDashboardQuerySchema)['_output']>) {
  const query = activityDashboardQuerySchema.parse(context.query)
  const response = await rpc.activities.dashboard.$get({ query }, { init: { signal: context.signal } })
  const body = await response.json()
  if (!response.ok) throw body
  const result = z.object({ data: z.array(activityDashboardSchema), total: z.number() }).parse(body)
  return { data: result.data, meta: { total: result.total } }
}
