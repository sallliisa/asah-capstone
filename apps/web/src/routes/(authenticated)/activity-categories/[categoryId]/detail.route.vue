<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/loom'
import { activityCategories } from '../activity-categories.resource'

const route = useRoute('activity-categories-detail')
const categoryId = computed(() => route.params.categoryId)
</script>

<template>
  <DetailView v-bind="activityCategories.detail({ id: categoryId })" />
</template>
