import { defineRoute, notFound } from '@southneuhof/sprindle'
import { requireOrgIdentity, requirePathParam, requirePermission } from '../../../../../identity'
import { readIssueReport } from '../../read'

export const GET = defineRoute({
  authorize: requirePermission('view-issue-reports'),
  action: async (args) => {
    const report = await readIssueReport(requirePathParam(args, 'id'), await requireOrgIdentity(args))
    if (!report) throw notFound()
    return { data: report }
  },
})
