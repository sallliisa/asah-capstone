<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { defineTable, Table, useRecord, type QueryValues } from '@southneuhof/loom'
import { detectorDetailSchema, detectorHistorySchema } from '@southneuhof/api/src/routes/(authenticated)/tenant-detector/schema.ts'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Dialog from '@southneuhof/loom/components/base/Dialog.vue'
import Icon from '@southneuhof/loom/components/base/Icon.vue'
import Chip from '@southneuhof/loom/components/base/Chip.vue'
import { permissions } from '@/stores/permissions'
import TenantGradeChip from '../../../tenant-detector/TenantGradeChip.vue'
import { isTenantGrade } from '../../../tenant-detector/grade-display'
import { loadTenantAssessment, loadTenantAssessmentHistory } from '../../../tenant-detector/tenant-detector.actions'

const props = defineProps<{ user: { id: string; name: string; email: string } }>()
const access = permissions()
const canReadAssessment = computed(() => access.can('view-users') && access.can('view-activities'))
const noAssessment = async () => undefined
const {
  record: assessment,
  error,
  refresh,
} = useRecord(() => ({
  id: props.user.id,
  resource: 'tenant-detector',
  schema: detectorDetailSchema,
  fields: {},
  load: canReadAssessment.value ? loadTenantAssessment : noAssessment,
}))
const isTenant = computed(() => canReadAssessment.value && assessment.value?.isTenant)
const historyQuery = ref<QueryValues>({ page: 1 })
let interval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (!canReadAssessment.value) return
  interval = setInterval(() => {
    if (canReadAssessment.value) void refresh().catch(() => {})
  }, 60000)
})
onBeforeUnmount(() => clearInterval(interval))

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
const waitingForFirstAssessment = computed(() => !assessment.value?.prediction && assessment.value?.state?.pending && !assessment.value.state.error)
const grade = computed(() => assessment.value?.prediction?.grade)
const factLabels: Record<string, string> = { repairs90: 'Repairs in 90 days', extraCleaning90: 'Extra cleanings in 90 days', oldestUnpaidDays: 'Oldest unpaid rent in days' }
const eligibilityLabels: Record<string, string> = {
  incomplete_recurrence: 'Rent occurrence generation must catch up.',
  less_than_90_days: 'The recorded history must span at least 90 days.',
  less_than_3_due_rents: 'At least three rent charges must have come due.',
  unknown_rent_amount: 'Record the expected rent amounts.',
  unknown_repair_amount: 'Record the settled repair amounts.',
}
const eligibilityMessages = computed(() => (assessment.value?.prediction?.eligibilityReasons ?? []).flatMap((reason) => (Object.hasOwn(eligibilityLabels, reason) ? [eligibilityLabels[reason]] : [])))
</script>

<template>
  <div class="min-w-0">
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <h2 class="min-w-0 text-xl font-semibold [overflow-wrap:anywhere]">{{ user.name }}</h2>
      <template v-if="isTenant && !error && !waitingForFirstAssessment">
        <TenantGradeChip v-if="grade" :grade="grade" />
        <Chip v-else color="neutral" variant="tonal"><span class="sr-only">Tenant attention </span>{{ assessment?.prediction ? 'Not enough data' : 'Not assessed yet' }}</Chip>
      </template>
      <Dialog v-if="isTenant" class="w-[calc(100%-2rem)] max-w-5xl">
        <template #trigger>
          <Button type="button" kind="icon" variant="standard" ariaLabel="Assessment history">
            <template #icon><Icon name="history" size="base" /></template>
          </Button>
        </template>
        <template #title>Assessment history</template>
        <template #content>
          <Table
            v-bind="history"
            v-model:query="historyQuery"
            :load="loadTenantAssessmentHistory"
            resource="tenant-detector"
            namespace="assessment-history"
            :search-parameters="{ tenantId: user.id }"
            :page-size-options="[10]"
          >
            <template #cell:grade="{ value }">
              <TenantGradeChip v-if="isTenantGrade(value)" :grade="value" compact />
              <span v-else>—</span>
            </template>
          </Table>
        </template>
      </Dialog>
    </div>
    <p class="mt-1 text-sm text-on-surface-variant [overflow-wrap:anywhere]">{{ user.email }}</p>

    <div v-if="canReadAssessment && (isTenant || error)" class="mt-3">
      <p v-if="error" role="alert" class="text-sm">Could not load this assessment.</p>
      <div v-else-if="isTenant && assessment" class="space-y-2 text-sm">
        <p v-if="assessment.state?.error" role="alert">The model service could not finish the assessment. It will retry automatically.</p>
        <p v-else-if="assessment.state?.pending" role="status">{{ assessment.prediction ? 'Refresh queued.' : 'Waiting for the first assessment.' }}</p>
        <p v-else-if="assessment.stale" role="status">Records changed after this assessment.</p>
        <p v-if="assessment.overdue.length" class="font-medium">Overdue rent payments: {{ assessment.overdue.length }}</p>
        <ul v-if="eligibilityMessages.length" class="list-disc space-y-1 ps-5">
          <li v-for="reason in eligibilityMessages" :key="reason">{{ reason }}</li>
        </ul>
        <dl v-if="assessment.prediction?.facts.length" class="space-y-1">
          <div v-for="fact in assessment.prediction.facts" :key="fact.kind" class="flex flex-wrap items-baseline gap-x-2">
            <dt>{{ factLabels[fact.kind] ?? fact.kind }}</dt>
            <dd class="font-medium tabular-nums">{{ fact.value }}</dd>
            <dd v-if="fact.activityIds.length" class="flex flex-wrap gap-x-2">
              <RouterLink v-for="(activityId, index) in fact.activityIds" :key="activityId" :to="{ name: 'activities-detail', params: { activityId } }" class="text-primary underline">
                Record {{ index + 1 }}
              </RouterLink>
            </dd>
          </div>
        </dl>
        <p v-if="assessment.prediction" class="text-on-surface-variant">
          {{ assessment.prediction.windowStart }} to {{ assessment.prediction.asOfDate }} · Saved {{ new Date(assessment.prediction.generatedAt).toLocaleString('id-ID') }}
        </p>
      </div>
    </div>
  </div>
</template>
