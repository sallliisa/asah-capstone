<route>{ "meta": { "permission": "update-activities" } }</route>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { defineForm, FormView, type AfterSubmitContext } from '@southneuhof/loom'
import { activityAttributionSchema, activityStateSchema } from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import { rpc } from '@/framework/rpc'
import { activitiesActions } from '../activities.actions'
import { activities } from '../activities.resource'
import { activitiesRecordSchema } from '../activities.schema'

const route = useRoute('activities-tenant')
const activityId = computed(() => route.params.activityId)
const correctionForm = defineForm({
  schema: activityAttributionSchema,
  fields: {
    tenantId: { label: 'Tenant', renderer: 'select', initialValue: null, props: { load: activitiesActions.tenants, resource: 'users', pick: 'id', view: 'name', clearable: true } },
    reason: { label: 'Reason for correction', renderer: 'textarea' },
  },
})
const form = computed(() => ({
  resource: 'activities',
  namespace: 'tenant-correction',
  id: activityId.value,
  load: activitiesActions.detail,
  resolve: (record: (typeof activitiesRecordSchema)['_output']) => ({ ...correctionForm, initialData: { tenantId: record.tenantId }, submit }),
}))

async function submit(input: (typeof activityAttributionSchema)['_output']) {
  const response = await rpc.activities.attribute[':id'].$post({ param: { id: activityId.value }, json: input })
  const body = await response.json()
  if (!response.ok || !('data' in body)) throw body
  return activityStateSchema.parse(body.data)
}
async function afterSubmit({ navigate }: AfterSubmitContext<unknown>) {
  await activities.invalidate({ id: activityId.value })
  await navigate({ name: 'activities-detail', params: { activityId: activityId.value } })
}
</script>

<template>
  <FormView :form="form" title="Correct Tenant Association" :after-submit="afterSubmit" />
</template>
