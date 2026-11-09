<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { activities } from '../activities.resource'

const route = useRoute('activities-edit')
const activityId = computed(() => route.params.activityId)
</script>

<template>
  <FormView v-bind="activities.update({ id: activityId })" title="Edit Activity" />
</template>
