import { defineScope } from '@southneuhof/sprindle'
import { requirePermission } from '../../../identity'

export default defineScope({ authorize: async (args) => {
  await requirePermission('view-users')(args)
  await requirePermission('view-activities')(args)
} })
