<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/loom'
import { activities } from '../activities.resource'

const route = useRoute('activities-detail')
const activityId = computed(() => route.params.activityId)
</script>

<template>
  <DetailView v-bind="activities.detail({ id: activityId })" />
</template>
