import { defineDomainPart } from '@southneuhof/sprindle/model'
import { activityCategory } from './activity-categories.entity'
import { activityCategories } from './activity-categories.table'

export const domain = defineDomainPart({ tables: { activityCategories }, entities: [activityCategory] })
