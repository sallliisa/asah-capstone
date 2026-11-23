<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Detail, DetailView, Tabs, type RoutedTabItem } from '@southneuhof/loom'
import Card from '@southneuhof/loom/components/base/Card.vue'
import AppRouterView from '@/components/routing/AppRouterView.vue'
import { users } from '../users.resource'
import { permissions } from '@/stores/permissions'
import TenantAssessment from '../../../tenant-detector/TenantAssessment.vue'
import { roleAssignments } from './detail/role-assignments/role-assignments.resource'

const access = permissions()
const route = useRoute('settings-users-detail')
const userId = computed(() => String(route.params.userId))
const page = computed(() => users.detail({ id: userId.value }))
const tabs = computed<RoutedTabItem[]>(() => [
  { label: 'Activity History', permission: 'view-activities', to: { name: 'settings-users-detail-activities', params: { userId: userId.value } } },
  { label: 'Role Assignments', permission: roleAssignments.permissions.list, to: { name: 'settings-users-detail-role-assignments', params: { userId: userId.value } } },
])
</script>

<template>
  <DetailView v-bind="page">
    <template #body="{ record, detail }">
      <Card variant="outlined" color="surfaceContainer" class="p-0">
        <div class="grid items-start gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-5">
          <div class="min-w-0">
            <h2 class="text-xl font-semibold [overflow-wrap:anywhere]">{{ record.name }}</h2>
            <p class="mt-1 text-sm text-on-surface-variant [overflow-wrap:anywhere]">{{ record.email }}</p>
          </div>
          <Detail v-bind="detail" :fields="{ statusCode: detail.fields?.statusCode ?? {}, createdAt: detail.fields?.createdAt ?? {}, updatedAt: detail.fields?.updatedAt ?? {} }" />
        </div>
      </Card>

      <TenantAssessment v-if="access.can('view-activities')" :key="record.id" :tenant-id="record.id" />

      <div class="flex min-w-0 flex-col gap-2">
        <Tabs label="User records" variant="tonal" :items="tabs" />
        <AppRouterView />
      </div>
    </template>
  </DetailView>
</template>
