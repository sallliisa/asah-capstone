<script setup lang="ts">
import { defineTable, Table } from '@southneuhof/loom'
import { z } from 'zod/v4'
import { activitiesActions } from './activities.actions'

const props = defineProps<{ activityId: string }>()
const schema = z.object({ id: z.string(), previousTenant: z.string(), newTenant: z.string(), changedBy: z.string(), changedAt: z.string(), reason: z.string() })
const table = defineTable({
  schema,
  columns: {
    previousTenant: { label: 'Previous tenant' },
    newTenant: { label: 'New tenant' },
    reason: { label: 'Reason' },
    changedBy: { label: 'Changed by' },
    changedAt: { label: 'Changed at', format: 'datetime' },
  },
})
</script>

<template>
  <section class="flex flex-col gap-2">
    <h2 class="text-lg font-semibold">Tenant attribution history</h2>
    <Table v-bind="table" :load="activitiesActions.attributions" resource="activities" namespace="tenant-attributions" :search-parameters="{ activityId: props.activityId }" />
  </section>
</template>
