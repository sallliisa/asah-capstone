<script setup lang="ts">
import { computed, ref } from 'vue'
import { z } from 'zod/v4'
import { RouterLink } from 'vue-router'
import { defineForm, defineTable, Form, Table, useRecord } from '@southneuhof/loom'
import { detectorCoverageSchema, detectorDetailSchema, detectorHistorySchema } from '@southneuhof/api/src/routes/(authenticated)/tenant-detector/schema.ts'
import Button from '@southneuhof/loom/components/base/Button.vue'
import { permissions } from '@/stores/permissions'
import { loadTenantAssessment, loadTenantAssessmentHistory, refreshTenantAssessment, saveTenantCoverage } from './tenant-detector.actions'

const props = defineProps<{ tenantId: string; compact?: boolean }>()
const access = permissions()
const { record, loading, error, refresh } = useRecord(() => ({ id: props.tenantId, resource: 'tenant-detector', schema: detectorDetailSchema, fields: {}, load: loadTenantAssessment }))
const editing = ref(false)
const busy = ref(false)
const message = ref('')
const coverage = defineForm({
  schema: detectorCoverageSchema.extend({ repairCostsComplete: z.union([z.boolean(), z.literal('Y'), z.literal('N')]).transform((value) => value === true || value === 'Y') }),
  fields: {
    repairsFrom: { label: 'Complete repair records from', renderer: 'date' },
    cleaningFrom: { label: 'Complete cleaning records from', renderer: 'date' },
    rentFrom: { label: 'Complete rent records from', renderer: 'date' },
    repairCostsComplete: { label: 'Repair expense records are complete', renderer: 'checkbox' },
  },
})
const initialCoverage = computed(() => record.value?.coverage ?? { repairsFrom: null, cleaningFrom: null, rentFrom: null, repairCostsComplete: false })
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
const gradeLabels = { A: 'A · Routine', B: 'B · Check soon', C: 'C · Check first' }
const factLabels: Record<string, string> = { repairs90: 'Repairs in 90 days', extraCleaning90: 'Extra cleanings in 90 days', oldestUnpaidDays: 'Oldest unpaid rent in days' }
const eligibilityLabels: Record<string, string> = {
  missing_repairs_coverage: 'Confirm repair history coverage.',
  missing_cleaning_coverage: 'Confirm cleaning history coverage.',
  missing_rent_coverage: 'Confirm rent history coverage.',
  incomplete_repair_costs: 'Confirm complete repair expense records.',
  incomplete_recurrence: 'Rent occurrence generation must catch up.',
  less_than_90_days: 'At least 90 days of confirmed records are required.',
  less_than_3_due_rents: 'At least three due rent occurrences are required.',
  unknown_rent_amount: 'Record the expected rent amounts.',
  unknown_repair_amount: 'Record the settled repair amounts.',
}
async function queueRefresh() {
  busy.value = true
  try {
    await refreshTenantAssessment(props.tenantId)
    await refresh()
    message.value = 'Refresh queued. The last saved result stays available.'
  } catch {
    message.value = 'Could not queue the refresh.'
  } finally {
    busy.value = false
  }
}
async function submitCoverage(input: (typeof detectorCoverageSchema)['_output']) {
  const result = await saveTenantCoverage(props.tenantId, input)
  editing.value = false
  await refresh()
  return result
}
</script>

<template>
  <section v-if="loading || error || record?.isTenant" class="flex flex-col gap-3">
    <h2 class="text-lg font-semibold">Tenant attention</h2>
    <p v-if="loading">Loading assessment…</p>
    <p v-else-if="error" role="alert">Could not load this assessment.</p>
    <template v-else-if="record">
      <p class="font-semibold">{{ record.prediction?.grade ? gradeLabels[record.prediction.grade] : record.prediction ? 'Not enough data' : 'Not assessed yet' }}</p>
      <p>Experimental model trained with synthetic data. Review the source records; the grade does not establish tenant fault.</p>
      <p v-if="record.prediction">{{ record.prediction.windowStart }} – {{ record.prediction.asOfDate }} · Saved {{ new Date(record.prediction.generatedAt).toLocaleString('id-ID') }}</p>
      <p v-if="record.stale">This result needs a refresh.</p>
      <p v-if="record.state?.error">The model service could not finish the assessment. The last result is retained.</p>
      <p v-for="reason in record.prediction?.eligibilityReasons ?? []" :key="reason">{{ eligibilityLabels[reason] ?? reason }}</p>
      <ul v-if="record.prediction?.facts.length" class="flex flex-col gap-2">
        <li v-for="fact in record.prediction.facts" :key="fact.kind">
          {{ factLabels[fact.kind] ?? fact.kind }}: {{ fact.value }}
          <span v-for="(activityId, index) in fact.activityIds" :key="activityId" class="ml-2"
            ><RouterLink :to="{ name: 'activities-detail', params: { activityId } }">Record {{ index + 1 }}</RouterLink></span
          >
        </li>
      </ul>
      <p v-if="record.overdue.length">Current overdue rent: {{ record.overdue.length }} occurrence(s). This remains visible without a grade.</p>
      <RouterLink v-if="compact" :to="{ name: 'settings-users-detail', params: { userId: tenantId } }">Open tenant assessment</RouterLink>
      <template v-else>
        <div v-if="access.can('update-users')" class="flex flex-wrap gap-2">
          <Button :disabled="busy" @click="queueRefresh">Refresh assessment</Button>
          <Button variant="text" @click="editing = !editing">{{ editing ? 'Close coverage form' : 'Confirm recording coverage' }}</Button>
        </div>
        <p v-if="message" role="status">{{ message }}</p>
        <Form v-if="editing && access.can('update-users')" v-bind="coverage" :initial-data="initialCoverage" :submit="submitCoverage" />
        <h3 class="font-semibold">Assessment history</h3>
        <Table v-bind="history" :load="loadTenantAssessmentHistory" resource="tenant-detector" namespace="assessment-history" :search-parameters="{ tenantId }" />
      </template>
    </template>
  </section>
</template>
