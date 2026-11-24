<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/loom'
import { recurringPlans } from '../recurring-plans.resource'

const route = useRoute('recurring-plans-detail')
const planId = computed(() => route.params.planId)
</script>

<template>
  <DetailView v-bind="recurringPlans.detail({ id: planId })" />
</template>
