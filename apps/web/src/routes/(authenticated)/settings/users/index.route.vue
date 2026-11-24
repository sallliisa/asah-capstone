<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import TenantGradeChip from '../../tenant-detector/TenantGradeChip.vue'
import { users } from './users.resource'
</script>

<template>
  <div>
    <ListView v-bind="users.list()" title="Users">
      <template #cell:name="{ record }">
        <div class="flex flex-wrap items-center gap-2">
          <span>{{ record.name }}</span>
          <TenantGradeChip v-if="record.tenantAttentionGrade" :grade="record.tenantAttentionGrade" />
        </div>
      </template>
    </ListView>
  </div>
</template>
