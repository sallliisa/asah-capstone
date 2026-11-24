<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import Chip from '@southneuhof/loom/components/base/Chip.vue'
import { tenantGradeDisplay } from '../../tenant-detector/grade-display'
import { users } from './users.resource'
</script>

<template>
  <div>
    <ListView v-bind="users.list()" title="Users">
      <template #cell:name="{ record }">
        <div class="flex flex-wrap items-center gap-2">
          <span>{{ record.name }}</span>
          <Chip v-if="record.tenantAttentionGrade" :color="tenantGradeDisplay[record.tenantAttentionGrade].color" variant="tonal">
            <span class="sr-only">Tenant attention </span>{{ tenantGradeDisplay[record.tenantAttentionGrade].label }}
          </Chip>
        </div>
      </template>
    </ListView>
  </div>
</template>
