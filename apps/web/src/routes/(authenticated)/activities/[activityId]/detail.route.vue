<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { DetailView, useResourceRuntime } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import { activities } from '../activities.resource'

import AttributionHistory from '../AttributionHistory.vue'

const canUpdate = useResourceRuntime().adapters.access.allows({ operation: 'update', permission: 'update-activities' })
const canReadTenants = useResourceRuntime().adapters.access.allows({ operation: 'detail', permission: 'view-users' })
const route = useRoute('activities-detail')
const activityId = computed(() => route.params.activityId)
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="activities.detail({ id: activityId })">
      <template #controls>
        <RouterLink v-if="canReadTenants && canUpdate" :to="{ name: 'activities-tenant', params: { activityId } }">
          <Button variant="text">Change tenant</Button>
        </RouterLink>
      </template>
    </DetailView>
    <AttributionHistory v-if="canReadTenants" :activity-id="activityId" />
  </div>
</template>
