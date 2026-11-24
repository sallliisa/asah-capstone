import { defineScope } from '@southneuhof/sprindle'
import { activity } from './activities.entity'
import { presentActivity, readActivityLabels } from './projection'
import { activityPublicSchema } from './schema'

export default defineScope({
  entity: activity,
  context: () => {
    let labels: ReturnType<typeof readActivityLabels> | undefined
    return { activityLabels: () => labels ??= readActivityLabels() }
  },
  enrich: {
    schema: activityPublicSchema,
    run: async (record, { context }) => presentActivity(record, await context.activityLabels()),
  },
})
