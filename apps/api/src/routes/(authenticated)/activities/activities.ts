import { defineDomainPart } from '@southneuhof/sprindle/model'
import { activity } from './activities.entity'
import { activities } from './activities.table'

export const domain = defineDomainPart({ tables: { activities }, entities: [activity] })
