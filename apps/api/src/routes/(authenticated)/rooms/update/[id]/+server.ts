import { update } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../../identity'

import { validateAssignment } from '../../validate-assignment'

export const PATCH = update({ authorize: requirePermission('update-rooms'), validate: ({ state }) => validateAssignment(state.input) })
