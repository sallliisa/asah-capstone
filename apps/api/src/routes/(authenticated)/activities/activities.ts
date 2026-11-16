import { defineDomainPart } from '@southneuhof/sprindle/model'
import { activity } from './activities.entity'
import { activities, activityTenantAttributionChanges } from './activities.table'

export const domain = defineDomainPart({ tables: { activities, activityTenantAttributionChanges }, entities: [activity] })
