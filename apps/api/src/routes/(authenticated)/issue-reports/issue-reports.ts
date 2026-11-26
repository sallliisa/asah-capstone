import { defineDomainPart } from '@southneuhof/sprindle/model'
import { issueReport } from './issue-reports.entity'
import { issueReports } from './issue-reports.table'

export const domain = defineDomainPart({ tables: { issueReports }, entities: [issueReport] })
