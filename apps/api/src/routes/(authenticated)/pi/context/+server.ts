import { defineRoute } from '@southneuhof/sprindle'
import { readJsonBody } from '../../../../request-body'
import { getQuestionContext, questionSchema } from '../../../../knowledge/context'
import { requirePiOwner } from '../owner'

export const POST = defineRoute({
  authorize: async (args) => {
    await requirePiOwner(args)
  },
  openapi: { requestBody: questionSchema },
  action: async (args) => {
    const { c } = args
    const owner = await requirePiOwner(args)
    const input = questionSchema.parse(await readJsonBody(c))
    c.header('Cache-Control', 'no-store')
    return { data: await getQuestionContext(input.question, owner.userId) }
  },
})
