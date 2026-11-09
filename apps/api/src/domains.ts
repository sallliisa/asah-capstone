import { domain as activityCategories } from './routes/(authenticated)/activity-categories/activity-categories'
import { domain as activities } from './routes/(authenticated)/activities/activities'
import { domain as recurringPlans } from './routes/(authenticated)/recurring-plans/recurring-plans'
import { domain as roomTypes } from './routes/(authenticated)/room-types/room-types'
import { domain as rooms } from './routes/(authenticated)/rooms/rooms'
import { domain as auth } from './routes/auth/auth.domain'
import { domain as permissions } from './routes/(authenticated)/permissions/permissions'
import { domain as roles } from './routes/(authenticated)/roles/roles'
import { domain as users } from './routes/(authenticated)/users/users'

export const domains = [auth, permissions, roles, users, roomTypes, rooms, activityCategories, recurringPlans, activities] as const
