<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { activities } from './activities.resource'
import { activityCreateInitialData } from './activities.schema'

const route = useRoute('activities-create')
const page = computed(() => {
  const binding = activities.create()
  return { ...binding, form: { ...binding.form, initialData: activityCreateInitialData(route.query.preset) } }
})
</script>

<template>
  <FormView v-bind="page" title="Create Activity" />
</template>
