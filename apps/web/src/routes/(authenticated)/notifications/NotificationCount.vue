<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useCollection } from '@southneuhof/loom'
import { notificationActions } from './notifications.resource'

const { records, refresh } = useCollection(() => ({ load: notificationActions.unread, resource: 'notifications', namespace: 'unread-count', query: {}, searchParameters: {} }))
const unread = computed(() => records.value[0]?.unread ?? 0)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    void refresh()
  }, 60000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <span v-if="unread" class="ml-auto rounded-full bg-error px-2 py-0.5 text-xs font-semibold text-on-error" :aria-label="`${unread} unread notifications`">{{ unread }}</span>
</template>
