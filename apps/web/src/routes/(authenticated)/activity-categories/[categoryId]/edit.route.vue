<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { activityCategories } from '../activity-categories.resource'

const route = useRoute('activity-categories-edit')
const categoryId = computed(() => route.params.categoryId)
</script>

<template>
  <FormView v-bind="activityCategories.update({ id: categoryId })" title="Edit Activity Category" />
</template>
