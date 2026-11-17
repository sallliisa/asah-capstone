import { defineRoute, HttpError } from '@southneuhof/sprindle'
import { requirePiOwner } from '../owner'
import { cloudflareSession } from '../cloudflare-session'

export const POST = defineRoute({
  authorize: async (args) => {
    await requirePiOwner(args)
  },
  action: async ({ c }) => {
    c.header('Cache-Control', 'no-store')
    try {
      return { data: await cloudflareSession() }
    } catch {
      throw new HttpError(503, 'pi_unavailable', 'Pi could not connect. Check the instance and server configuration.')
    }
  },
})
