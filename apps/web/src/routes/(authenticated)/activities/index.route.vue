<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import { RouterLink } from 'vue-router'
import { resourceCan } from '@/framework/access'
import { activities, activityFilters } from './activities.resource'

const can = resourceCan(activities)
</script>

<template>
  <ListView v-bind="activities.list()" title="Activities" :filters="activityFilters" :create-route="{ name: 'activities-create', query: { preset: undefined } }">
    <template #resource-action>
      <RouterLink v-if="can('create')" :to="{ name: 'activities-create', query: { preset: 'schedule' } }" custom v-slot="{ href, navigate }">
        <Button variant="outlined" :href="href" @click="navigate">Schedule once</Button>
      </RouterLink>
    </template>
  </ListView>
</template>
