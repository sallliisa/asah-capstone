<script setup lang="ts">
import { useCollection } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import { formatDateTime } from '@southneuhof/utilities/format'
import { activities } from './activities.resource'

const props = defineProps<{ activityId: string }>()
const { records, loading, error, refresh } = useCollection(() => ({
  load: activities.actions.attributions,
  namespace: 'tenant-attributions',
  query: {},
  searchParameters: { activityId: props.activityId },
}))
</script>

<template>
  <Card variant="outlined" color="surfaceContainer" class="min-w-0 p-0">
    <section aria-labelledby="tenant-changes-heading" class="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
      <h2 id="tenant-changes-heading" class="text-lg font-semibold">Tenant changes</h2>
      <div v-if="error" class="flex flex-wrap items-center gap-2">
        <p role="alert" class="text-sm text-on-surface">Could not load tenant changes.</p>
        <Button type="button" variant="text" :disabled="loading" @click="refresh">Retry</Button>
      </div>

      <ol v-if="records.length" role="list" class="divide-y divide-outline-variant">
        <li v-for="change in records" :key="change.id" class="grid gap-1 py-3 text-sm [overflow-wrap:anywhere] sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:gap-x-6">
          <p class="text-on-surface">
            From <span class="font-medium">{{ change.previousTenant }}</span> to <span class="font-semibold">{{ change.newTenant }}</span>
          </p>
          <p class="text-on-surface-variant sm:text-right">
            {{ change.changedBy }} · <time :datetime="change.changedAt">{{ formatDateTime(change.changedAt) }}</time>
          </p>
          <p v-if="change.reason.trim()" class="whitespace-pre-wrap text-on-surface-variant sm:col-span-2">{{ change.reason }}</p>
        </li>
      </ol>
      <p v-else-if="loading" role="status" class="text-sm text-on-surface-variant">Loading tenant changes…</p>
      <p v-else-if="!error" class="text-sm text-on-surface-variant">No tenant changes yet.</p>
    </section>
  </Card>
</template>
