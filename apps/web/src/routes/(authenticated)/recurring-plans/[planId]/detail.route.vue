<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/loom'
import { recurringPlans } from '../recurring-plans.resource'

const route = useRoute('recurring-plans-detail')
const planId = computed(() => route.params.planId)
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="recurringPlans.detail({ id: planId })" />
    <p class="text-sm text-on-surface-variant">
      After the first occurrence, the repeat schedule is fixed. Pause this plan and create a new one to change the schedule. Reactivation includes missed dates.
    </p>
  </div>
</template>
