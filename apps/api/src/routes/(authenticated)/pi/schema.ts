import { z } from 'zod/v4'

export const piSessionSchema = z.object({
  url: z.url(),
  session: z.object({ token: z.string().min(1), accountId: z.string().min(1) }),
})
