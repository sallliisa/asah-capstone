import { activityCategories } from '../src/routes/(authenticated)/activity-categories/activity-categories.table'
import { getDb } from '../src/db'
import { roomTypes } from '../src/routes/(authenticated)/room-types/room-types.table'
import { roles } from '../src/routes/(authenticated)/roles/roles.table'

export async function seedBoardingHouse() {
  await getDb().insert(activityCategories).values([
    { id: 'activity-category-general', name: 'General' },
    { id: 'activity-category-corrective-repairs', name: 'Corrective Repairs' },
    { id: 'activity-category-scheduled-servicing', name: 'Scheduled Servicing' },
    { id: 'activity-category-routine-cleaning', name: 'Routine Cleaning' },
    { id: 'activity-category-extra-cleaning', name: 'Extra Cleaning' },
    { id: 'activity-category-room-rent', name: 'Room Rent' },
  ]).onConflictDoNothing()
  await getDb().insert(roles).values({ id: 'role-occupant', roleCode: 'occupant', name: 'Occupant', active: true }).onConflictDoNothing({ target: roles.roleCode })
  await getDb().insert(roomTypes).values({ id: 'room-type-standard', name: 'Standard', cost: 1500000 }).onConflictDoNothing({ target: roomTypes.id })
}
