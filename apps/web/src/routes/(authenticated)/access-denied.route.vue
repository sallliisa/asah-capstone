<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getDefaultAuthenticatedRouteLocation } from '@/router/navigation'

const home = computed(() => getDefaultAuthenticatedRouteLocation())
</script>

<template>
  <section class="flex flex-col items-start gap-2">
    <h1 class="text-xl font-semibold">Access denied</h1>
    <RouterLink v-if="home" :to="home" class="text-primary underline">Go to your home page</RouterLink>
  </section>
</template>
