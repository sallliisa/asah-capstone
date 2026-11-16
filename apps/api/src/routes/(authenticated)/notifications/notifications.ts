import { defineDomainPart } from '@southneuhof/sprindle/model'
import { notification } from './notifications.entity'
import { notifications, notificationDeliveries, pushSubscriptions } from './notifications.table'

export const domain = defineDomainPart({ tables: { notifications, notificationDeliveries, pushSubscriptions }, entities: [notification] })
