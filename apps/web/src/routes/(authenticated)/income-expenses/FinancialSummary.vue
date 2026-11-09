<script setup lang="ts">
import { computed } from 'vue'
import { useCollection, type CollectionLoadContext, type QueryValues } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import { activities } from '../activities/activities.resource'
import { activitiesQuerySchema } from '../activities/activities.schema'

const props = defineProps<{ query: QueryValues }>()
const summaryQuery = computed(() => ({ ...props.query, financialOnly: true }))
async function loadSummary(context: CollectionLoadContext<Record<string, never>>) {
  const filters = await activitiesQuerySchema.parseAsync(context.searchParameters)
  return activities.actions.summary({ ...context, query: {}, searchParameters: filters })
}
const { records, loading, error, refresh } = useCollection(() => ({ load: loadSummary, resource: 'activities', namespace: 'financial-summary', query: {}, searchParameters: summaryQuery.value }))
const summary = computed(() => records.value[0])
const number = (value: number) => value.toLocaleString('id-ID')
</script>

<template>
  <section class="flex flex-col gap-2" aria-label="Financial totals">
    <p v-if="loading" role="status">Loading totals…</p>
    <div v-else-if="error" class="flex items-center gap-2" role="alert">
      <p>Could not load totals.</p>
      <Button type="button" variant="text" @click="refresh">Retry</Button>
    </div>
    <dl v-else-if="summary" class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <dt class="text-sm text-on-surface-variant">Income</dt>
        <dd class="break-words text-lg font-semibold tabular-nums">{{ number(summary.income) }}</dd>
      </Card>
      <Card>
        <dt class="text-sm text-on-surface-variant">Expenses</dt>
        <dd class="break-words text-lg font-semibold tabular-nums">{{ number(summary.expenses) }}</dd>
      </Card>
      <Card>
        <dt class="text-sm text-on-surface-variant">Net cash movement</dt>
        <dd class="break-words text-lg font-semibold tabular-nums">{{ number(summary.net) }}</dd>
      </Card>
      <Card>
        <dt class="text-sm text-on-surface-variant">Draft payments</dt>
        <dd class="break-words text-lg font-semibold tabular-nums">{{ number(summary.draftCount) }}</dd>
      </Card>
    </dl>
  </section>
</template>
