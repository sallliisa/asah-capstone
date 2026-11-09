<route>{ "meta": { "permission": "view-activities" } }</route>
<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import { activities, activityFilters } from '../activities/activities.resource'
import FinancialSummary from './FinancialSummary.vue'
</script>

<template>
  <ListView
    v-bind="activities.list({ searchParameters: { financialOnly: true } })"
    title="Income & Expenses"
    :filters="activityFilters"
    :create-route="{ name: 'activities-create', query: { preset: 'expense' } }"
  >
    <template #context="{ query }">
      <FinancialSummary :query="query" />
    </template>
  </ListView>
</template>
