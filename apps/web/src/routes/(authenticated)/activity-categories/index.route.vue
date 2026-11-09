<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import { activityCategories } from './activity-categories.resource'
</script>

<template>
  <ListView v-bind="activityCategories.list()" title="Activity Categories" />
</template>
