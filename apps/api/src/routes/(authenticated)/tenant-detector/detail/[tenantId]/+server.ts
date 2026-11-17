import { defineRoute } from '@southneuhof/sprindle'
import { requirePathParam } from '../../../../../identity'
import { readTenantAssessment } from '../../projection'

export const GET = defineRoute({ action: async (args) => ({ data: await readTenantAssessment(requirePathParam(args, 'tenantId')) }) })
