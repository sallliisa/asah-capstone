<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import { activities, activityFilters } from './activities.resource'
</script>

<template>
  <ListView v-bind="activities.list()" title="Activities" :filters="activityFilters" :create-route="{ name: 'activities-create', query: { preset: undefined } }" />
</template>
