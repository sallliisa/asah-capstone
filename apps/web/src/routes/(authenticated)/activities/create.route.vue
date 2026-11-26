<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { activities } from './activities.resource'
import { activitiesScheduleSchema, activityCreateInitialData } from './activities.schema'

const route = useRoute('activities-create')
const scheduled = computed(() => route.query.preset === 'schedule')
const page = computed(() => {
  const binding = activities.create({ context: { scheduled: scheduled.value }, initialData: activityCreateInitialData(route.query.preset) })
  return {
    ...binding,
    form: {
      ...binding.form,
      schema: scheduled.value ? activitiesScheduleSchema : binding.form.schema,
    },
  }
})
</script>

<template>
  <FormView v-bind="page" :title="scheduled ? 'Schedule once' : 'Create Activity'" />
</template>
