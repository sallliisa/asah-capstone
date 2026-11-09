import { defineDomainPart } from '@southneuhof/sprindle/model'
import { room } from './rooms.entity'
import { rooms } from './rooms.table'

export const domain = defineDomainPart({ tables: { rooms }, entities: [room] })
