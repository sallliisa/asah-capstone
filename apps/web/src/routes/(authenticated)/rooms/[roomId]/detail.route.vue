<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Detail, DetailView } from '@southneuhof/loom'
import { rooms } from '../rooms.resource'
import { permissions } from '@/stores/permissions'
import TenantAssessment from '../../tenant-detector/TenantAssessment.vue'

const access = permissions()

const route = useRoute('rooms-detail')
const roomId = computed(() => route.params.roomId)
</script>

<template>
  <DetailView v-bind="rooms.detail({ id: roomId })">
    <template #body="{ record, detail }">
      <Detail v-bind="detail" />
      <TenantAssessment v-if="record.occupantId && access.can('view-users') && access.can('view-activities')" :tenant-id="record.occupantId" compact />
    </template>
  </DetailView>
</template>
