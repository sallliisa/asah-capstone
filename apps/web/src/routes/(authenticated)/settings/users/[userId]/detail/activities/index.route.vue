<route>{ "meta": { "permission": "view-activities" } }</route>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ListView } from '@southneuhof/loom'
import { activities } from '../../../../../activities/activities.resource'

const route = useRoute('settings-users-detail-activities')
const list = computed(() => activities.list({ searchParameters: { tenantId: String(route.params.userId) } }))
</script>

<template>
  <ListView v-bind="list" title="Activity History" />
</template>
