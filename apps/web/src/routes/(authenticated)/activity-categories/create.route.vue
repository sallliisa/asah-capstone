<script setup lang="ts">
import { FormView } from '@southneuhof/loom'
import { activityCategories } from './activity-categories.resource'
</script>

<template>
  <FormView v-bind="activityCategories.create()" title="Create Activity Category" />
</template>
