import { defineRoute } from '@southneuhof/sprindle'
import { sql } from 'drizzle-orm'
import { getDb } from '../../../../db'
import { requirePermission } from '../../../../identity'
import { activities } from '../activities.table'
import { activityQuerySchema, activityWhere } from '../query'

export const GET = defineRoute({
  authorize: requirePermission('view-activities'),
  action: async ({ c }) => {
    const query = activityQuerySchema.parse(c.req.query())
    const rows = await getDb().select({
      income: sql<string>`coalesce(sum(case when ${activities.financialKind} = 'income' and ${activities.paymentStatus} = 'settled' then ${activities.amount} else 0 end), 0)`,
      expenses: sql<string>`coalesce(sum(case when ${activities.financialKind} = 'expense' and ${activities.paymentStatus} = 'settled' then ${activities.amount} else 0 end), 0)`,
      draftCount: sql<string>`count(*) filter (where ${activities.financialKind} <> 'none' and ${activities.paymentStatus} = 'draft')`,
    }).from(activities).where(activityWhere(query))
    const income = Number(rows[0]?.income ?? 0)
    const expenses = Number(rows[0]?.expenses ?? 0)
    return { data: [{ income, expenses, net: income - expenses, draftCount: Number(rows[0]?.draftCount ?? 0) }], total: 1 }
  },
})
