import type { CollectionLoadContext, RecordLoadContext } from '@southneuhof/loom'
import { detectorCoverageSchema, detectorDetailSchema } from '@southneuhof/api/src/routes/(authenticated)/tenant-detector/schema.ts'
import { rpc } from '@/framework/rpc'

const detector = rpc['tenant-detector']

export async function loadTenantAssessment({ id }: RecordLoadContext) {
  const response = await detector.detail[':tenantId'].$get({ param: { tenantId: String(id) } })
  const body = await response.json()
  if (!response.ok || !('data' in body)) throw body
  return detectorDetailSchema.parse(body.data)
}

export async function loadTenantPriorities() {
  const response = await detector.list.$get()
  const body = await response.json()
  if (!response.ok || !('data' in body)) throw body
  return { data: body.data, meta: { total: body.total } }
}

export async function loadTenantAssessmentHistory(context: CollectionLoadContext) {
  const tenantId = String(context.searchParameters?.tenantId ?? '')
  const response = await detector.history[':tenantId'].$get({ param: { tenantId }, query: { page: String(context.query?.page ?? 1) } })
  const body = await response.json()
  if (!response.ok || !('data' in body)) throw body
  return { data: body.data, meta: { total: body.total } }
}

export async function saveTenantCoverage(tenantId: string, input: (typeof detectorCoverageSchema)['_output']) {
  const response = await detector.coverage[':tenantId'].$put({ param: { tenantId }, json: input })
  const body = await response.json()
  if (!response.ok || !('data' in body)) throw body
  return body.data
}

export async function refreshTenantAssessment(tenantId: string) {
  const response = await detector.refresh[':tenantId'].$post({ param: { tenantId } })
  if (!response.ok) throw await response.json()
}
