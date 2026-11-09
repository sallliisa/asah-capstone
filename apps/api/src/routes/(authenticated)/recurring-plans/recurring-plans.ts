import { defineDomainPart } from '@southneuhof/sprindle/model'
import { recurringPlan } from './recurring-plans.entity'
import { recurringPlans } from './recurring-plans.table'

export const domain = defineDomainPart({ tables: { recurringPlans }, entities: [recurringPlan] })
