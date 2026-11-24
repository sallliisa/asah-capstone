<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { recurringPlans } from '../recurring-plans.resource'

const route = useRoute('recurring-plans-edit')
const planId = computed(() => route.params.planId)
</script>

<template>
  <FormView v-bind="recurringPlans.update({ id: planId })" title="Edit Recurring Plan" />
</template>
