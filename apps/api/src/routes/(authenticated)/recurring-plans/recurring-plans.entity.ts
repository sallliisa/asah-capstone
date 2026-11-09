import { createEntity } from '@southneuhof/sprindle/entity'
import { recurringPlanCreateSchema, recurringPlanUpdateSchema, recurringPlanSelectSchema } from './schema'
import { recurringPlans } from './recurring-plans.table'

export const recurringPlan = createEntity({ table: recurringPlans, schemas: { create: recurringPlanCreateSchema, update: recurringPlanUpdateSchema, select: recurringPlanSelectSchema } })
