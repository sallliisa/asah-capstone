import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { defineRoute } from '@southneuhof/sprindle'

const require = createRequire(import.meta.url)
const bundle = require.resolve('swagger-ui-dist/swagger-ui-bundle.js')
const stylesheet = require.resolve('swagger-ui-dist/swagger-ui.css')

export const GET = defineRoute({
  action: async ({ c }): Promise<Response> => {
    const asset = c.req.param('asset')
    if (asset === 'swagger-ui-bundle.js') return c.body(await readFile(bundle, 'utf8'), 200, { 'Content-Type': 'text/javascript; charset=utf-8' })
    if (asset === 'swagger-ui.css') return c.body(await readFile(stylesheet, 'utf8'), 200, { 'Content-Type': 'text/css; charset=utf-8' })
    return c.notFound()
  },
})
