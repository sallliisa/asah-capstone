<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { defineTable, Table, useRecord, useFrameworkQueryClient, invalidateResourceData } from '@southneuhof/loom'
import { detectorDetailSchema, detectorHistorySchema } from '@southneuhof/api/src/routes/(authenticated)/tenant-detector/schema.ts'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import Chip from '@southneuhof/loom/components/base/Chip.vue'
import Disclosure from '@southneuhof/loom/components/base/Disclosure.vue'
import { permissions } from '@/stores/permissions'
import { loadTenantAssessment, loadTenantAssessmentHistory, refreshTenantAssessment } from './tenant-detector.actions'

const props = defineProps<{ tenantId: string }>()
const access = permissions()
const queryClient = useFrameworkQueryClient()
const refreshAssessment = () => invalidateResourceData(queryClient, { resource: 'tenant-detector' })
let interval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  interval = setInterval(() => {
    void refreshAssessment().catch(() => {})
  }, 60000)
})
onBeforeUnmount(() => clearInterval(interval))
const { record, loading, error } = useRecord(() => ({ id: props.tenantId, resource: 'tenant-detector', schema: detectorDetailSchema, fields: {}, load: loadTenantAssessment }))
const busy = ref(false)
const message = ref('')
const history = defineTable({
  schema: detectorHistorySchema,
  columns: {
    asOfDate: { label: 'Assessment date', format: 'date' },
    grade: { label: 'Grade' },
    windowStart: { label: 'History starts', format: 'date' },
    generatedAt: { label: 'Saved at', format: 'datetime' },
    modelVersion: { label: 'Model version' },
  },
})
const grades = {
  A: { label: 'A · Routine', color: 'neutral' },
  B: { label: 'B · Check soon', color: 'secondary' },
  C: { label: 'C · Check first', color: 'warning' },
} as const
const grade = computed(() => {
  const prediction = record.value?.prediction
  if (prediction?.grade) return grades[prediction.grade]
  return { label: prediction ? 'Not enough data' : 'Not assessed yet', color: 'neutral' } as const
})
const factLabels: Record<string, string> = { repairs90: 'Repairs in 90 days', extraCleaning90: 'Extra cleanings in 90 days', oldestUnpaidDays: 'Oldest unpaid rent in days' }
const eligibilityLabels: Record<string, string> = {
  incomplete_recurrence: 'Rent occurrence generation must catch up.',
  less_than_90_days: 'The recorded history must span at least 90 days.',
  less_than_3_due_rents: 'At least three rent charges must have come due.',
  unknown_rent_amount: 'Record the expected rent amounts.',
  unknown_repair_amount: 'Record the settled repair amounts.',
}
const eligibilityMessages = computed(() => (record.value?.prediction?.eligibilityReasons ?? []).flatMap((reason) => (Object.hasOwn(eligibilityLabels, reason) ? [eligibilityLabels[reason]] : [])))
async function queueRefresh() {
  busy.value = true
  try {
    await refreshTenantAssessment(props.tenantId)
    await refreshAssessment()
    message.value = 'Refresh queued. The last saved result stays available.'
  } catch {
    message.value = 'Could not queue the refresh.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Card v-if="loading || error || record?.isTenant" variant="outlined" color="surfaceContainer" class="min-w-0 p-0">
    <section class="flex min-w-0 flex-col gap-4 p-4 sm:p-5" aria-labelledby="tenant-attention-heading">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <h2 id="tenant-attention-heading" class="text-lg font-semibold">Tenant attention</h2>
          <Chip v-if="record && !loading && !error" :color="grade.color" variant="tonal">{{ grade.label }}</Chip>
        </div>
        <div v-if="record && !loading && !error && access.can('update-users')" class="flex flex-wrap gap-2">
          <Button variant="outlined" :disabled="busy" @click="queueRefresh">Refresh assessment</Button>
        </div>
      </div>

      <p v-if="loading" role="status">Loading assessment…</p>
      <p v-else-if="error" role="alert">Could not load this assessment.</p>
      <template v-else-if="record">
        <div class="space-y-2 text-sm">
          <p v-if="record.state?.error" role="alert">The model service could not finish the assessment. It will retry automatically.</p>
          <p v-else-if="record.state?.pending" role="status">{{ record.prediction ? 'Refresh queued.' : 'Waiting for the first assessment.' }}</p>
          <p v-else-if="record.stale" role="status">Records changed after this assessment.</p>
          <p v-if="record.overdue.length" class="font-medium">Overdue rent payments: {{ record.overdue.length }}</p>
          <ul v-if="eligibilityMessages.length" class="list-disc space-y-1 ps-5">
            <li v-for="reason in eligibilityMessages" :key="reason">{{ reason }}</li>
          </ul>
          <dl v-if="record.prediction?.facts.length" class="space-y-1">
            <div v-for="fact in record.prediction.facts" :key="fact.kind" class="flex flex-wrap items-baseline gap-x-2">
              <dt>{{ factLabels[fact.kind] ?? fact.kind }}</dt>
              <dd class="font-medium tabular-nums">{{ fact.value }}</dd>
              <dd v-if="fact.activityIds.length" class="flex flex-wrap gap-x-2">
                <RouterLink v-for="(activityId, index) in fact.activityIds" :key="activityId" :to="{ name: 'activities-detail', params: { activityId } }" class="text-primary underline">
                  Record {{ index + 1 }}
                </RouterLink>
              </dd>
            </div>
          </dl>
          <p v-if="record.prediction" class="text-on-surface-variant">
            {{ record.prediction.windowStart }} to {{ record.prediction.asOfDate }} · Saved {{ new Date(record.prediction.generatedAt).toLocaleString('id-ID') }}
          </p>
          <p class="max-w-prose text-on-surface-variant">Based on recorded activity. The model uses synthetic training data. Use the grade to decide which records to review first.</p>
          <p v-if="message" role="status">{{ message }}</p>
        </div>

        <Disclosure title="Assessment history">
          <div class="mt-2 min-w-0">
            <Table v-bind="history" :load="loadTenantAssessmentHistory" resource="tenant-detector" namespace="assessment-history" :search-parameters="{ tenantId }" />
          </div>
        </Disclosure>
      </template>
    </section>
  </Card>
</template>
