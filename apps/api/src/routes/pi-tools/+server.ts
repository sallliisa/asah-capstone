import { timingSafeEqual } from 'node:crypto'
import { defineRoute, forbidden, unauthorized } from '@southneuhof/sprindle'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { resolveIdentity } from '../../authorization'
import { getQuestionContext, questionSchema } from '../../knowledge/context'
import { piOwnerId } from '../(authenticated)/pi/owner'
import { piReadSchema, readAppData } from '../(authenticated)/pi/read'

export const POST = defineRoute({
  action: async ({ c }) => {
    const expected = process.env.PI_TOOLS_SECRET
    const supplied = c.req.header('authorization')?.replace(/^Bearer /, '')
    if (!expected || !supplied || Buffer.byteLength(expected) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) throw unauthorized()
    const ownerId = await piOwnerId()
    const owner = ownerId ? await resolveIdentity(ownerId) : null
    if (!owner) throw forbidden('Pi owner is unavailable.')
    const server = new McpServer({ name: 'kos-owner-tools', version: '1.0.0' })
    server.registerTool(
      'getQuestionContext',
      {
        description: 'Route one complete Indonesian kos question through the trained classifier. Returns its selected private workflow context and supporting RAG passages.',
        inputSchema: questionSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
      },
      async ({ question }) => ({ content: [{ type: 'text', text: JSON.stringify(await getQuestionContext(question, owner.userId)) }] })
    )
    server.registerTool(
      'readAppData',
      {
        description: 'Read authorized current app records after routing. Supports rooms, activities, schedules, settled cash, and saved tenant assessment. No writes.',
        inputSchema: piReadSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
      },
      async (input) => {
        try {
          return { content: [{ type: 'text', text: JSON.stringify(await readAppData(owner, input.request)) }] }
        } catch {
          return { isError: true, content: [{ type: 'text', text: 'Data tidak tersedia atau izin baca tidak mencukupi. Jangan mengarang hasil.' }] }
        }
      }
    )
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    await server.connect(transport)
    try {
      const response = await transport.handleRequest(c.req.raw)
      const body = await response.text()
      return new Response(body || null, { status: response.status, headers: { ...Object.fromEntries(response.headers), 'Cache-Control': 'no-store' } })
    } finally {
      await server.close()
    }
  },
})
