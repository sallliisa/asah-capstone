import { defineScope } from '@southneuhof/sprindle'
import { notification } from './notifications.entity'
import { requireNotificationOwner } from './owner'

export default defineScope({ entity: notification, authorize: async (args) => { await requireNotificationOwner(args) } })
