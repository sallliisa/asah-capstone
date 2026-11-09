import { defineDomainPart } from '@southneuhof/sprindle/model'
import { roomType } from './room-types.entity'
import { roomTypes } from './room-types.table'

export const domain = defineDomainPart({ tables: { roomTypes }, entities: [roomType] })
