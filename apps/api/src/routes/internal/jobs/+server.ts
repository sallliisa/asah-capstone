import { defineRoute, unauthorized } from '@southneuhof/sprindle'
import { timingSafeEqual } from 'node:crypto'
import { runBackgroundJobs } from '../../../background-jobs'

export const POST = defineRoute({ action: async ({ c }) => {
  const expected = process.env.JOB_SECRET
  const supplied = c.req.header('authorization')?.replace(/^Bearer /, '')
  if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) throw unauthorized()
  const results = await runBackgroundJobs()
  if (Object.values(results).some((result) => 'failed' in result || Boolean('error' in result && result.error))) return c.json(results, 500)
  return results
} })
