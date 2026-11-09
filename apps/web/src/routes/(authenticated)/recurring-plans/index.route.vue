<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import { recurringPlans } from './recurring-plans.resource'
</script>

<template>
  <ListView v-bind="recurringPlans.list()" title="Recurring Plans" />
</template>
