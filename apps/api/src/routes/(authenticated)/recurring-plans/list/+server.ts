import { list } from '@southneuhof/sprindle'
import { requirePermission } from '../../../../identity'

export const GET = list({ authorize: requirePermission('view-recurring-plans'), query: { defaultSort: 'name', defaultOrder: 'asc' } })
