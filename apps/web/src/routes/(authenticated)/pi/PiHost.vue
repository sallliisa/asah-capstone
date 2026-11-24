<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'
import { piSessionSchema } from '@southneuhof/api/src/routes/(authenticated)/pi/schema.ts'
import { rpc } from '@/framework/rpc'
import { identity } from '@/framework/identity'
import { rememberPiEndpoint, waitForPiCleanup } from './session'

const WispHost = defineAsyncComponent(() => import('./WispHost.vue'))
const connection = ref<(typeof piSessionSchema)['_output']>()
const message = ref('')
let revision = 0
watch(
  () => identity.value?.user?.id,
  async (userId) => {
    const current = ++revision
    connection.value = undefined
    message.value = ''
    if (!userId) return
    await waitForPiCleanup()
    try {
      const response = await rpc.pi.session.$post()
      if (current !== revision) return
      if (response.status === 403) return
      const body = await response.json()
      if (!response.ok || !('data' in body)) throw new Error('Pi is unavailable.')
      connection.value = piSessionSchema.parse(body.data)
      rememberPiEndpoint(connection.value.url)
    } catch {
      if (current === revision) message.value = 'Pi is unavailable.'
    }
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  revision += 1
})
</script>

<template>
  <WispHost v-if="connection" :key="connection.url" :connection="connection" />
  <p v-else-if="message" class="fixed bottom-24 left-4 z-40 max-w-xs rounded bg-surface-container p-3 text-sm text-on-surface" role="status">{{ message }}</p>
</template>
