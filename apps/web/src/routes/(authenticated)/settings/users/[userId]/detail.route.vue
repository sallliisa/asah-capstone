<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView, Tabs, type RoutedTabItem } from '@southneuhof/loom'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import { users } from '../users.resource'
import { permissions } from '@/stores/permissions'
import TenantAssessment from '../../../tenant-detector/TenantAssessment.vue'

const access = permissions()
const route = useRoute('settings-users-detail')
const userId = route.params.userId

const tabs = [
  { permission: 'view-activities', to: { name: 'settings-users-detail-activities', params: { userId: String(userId) } }, label: 'Activity History' },
  { permission: 'view-role-assignments', to: { name: 'settings-users-detail-role-assignments', params: { userId: String(userId) } }, label: 'Role Assignments' },
] satisfies readonly RoutedTabItem[]
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView v-bind="users.detail({ id: userId })" />
    <TenantAssessment v-if="access.can('view-activities')" :tenant-id="String(userId)" />
    <Tabs label="Pengguna" :items="tabs" />
    <AppRouterView />
  </div>
</template>
