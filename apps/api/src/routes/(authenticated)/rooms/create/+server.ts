import { create } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../identity'

import { validateAssignment } from '../validate-assignment'

export const POST = create({ authorize: requirePermission('create-rooms'), validate: ({ state }) => validateAssignment(state.input) })
