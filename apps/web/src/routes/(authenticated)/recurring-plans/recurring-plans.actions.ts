import { createHonoResourceActions } from '@/framework/hono'
import { rpc } from '@/framework/rpc'
import { recurringPlansQuerySchema } from './recurring-plans.schema'

export const recurringPlansActions = createHonoResourceActions(rpc['recurring-plans'], { querySchema: recurringPlansQuerySchema })
