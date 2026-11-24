import { defineRoute } from '@southneuhof/sprindle'
import { generateInstalledOpenApi } from '@southneuhof/sprindle/openapi'

export const GET = defineRoute({ action: ({ c }): Response => c.json(generateInstalledOpenApi(c, { title: 'Kos De Mansion API', version: '0.0.0' })) })
