import { processTenantDetector } from '../../(authenticated)/tenant-detector/process'
import { defineRoute, unauthorized } from '@southneuhof/sprindle'
import { timingSafeEqual } from 'node:crypto'
import { generateDueActivities } from '../../(authenticated)/recurring-plans/generate'
import { processNotifications } from '../../(authenticated)/notifications/deliver'

export const POST = defineRoute({ action: async ({ c }) => {
  const expected = process.env.JOB_SECRET
  const supplied = c.req.header('authorization')?.replace(/^Bearer /, '')
  if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) throw unauthorized()
  const recurrence = await generateDueActivities()
  const notifications = await processNotifications()
  const tenantDetector = await processTenantDetector()
  return { recurrence, notifications, tenantDetector }
} })
