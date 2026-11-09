<script setup lang="ts">
import { FormView } from '@southneuhof/loom'
import { recurringPlans } from './recurring-plans.resource'
</script>

<template>
  <FormView v-bind="recurringPlans.create()" title="Create Recurring Plan" />
</template>
