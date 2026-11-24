<script setup lang="ts">
import Chip from '@southneuhof/loom/components/base/Chip.vue'
import { tenantGradeLabels, type TenantGrade } from './grade-display'

defineProps<{ grade: TenantGrade; compact?: boolean }>()
</script>

<template>
  <Chip color="neutral" variant="tonal" v-bind="{ 'data-tenant-grade': grade }">
    <span class="sr-only">Tenant attention </span>
    <span :class="{ 'sr-only': compact }">{{ tenantGradeLabels[grade] }}</span>
    <span v-if="compact" aria-hidden="true">{{ grade }}</span>
  </Chip>
</template>
