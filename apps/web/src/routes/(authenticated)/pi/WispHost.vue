<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { WispChat, useWispChat } from '@southneuhof/wisp-vue-ui'
import '@southneuhof/wisp-vue-ui/style.css'
import type { piSessionSchema } from '@southneuhof/api/src/routes/(authenticated)/pi/schema.ts'
import { identity } from '@/framework/identity'
import { watch } from 'vue'

const props = defineProps<{ connection: (typeof piSessionSchema)['_output'] }>()
const chat = useWispChat({ url: props.connection.url })
const message = ref('')
let disposed = false
async function connect() {
  try {
    await chat.client.auth.setSession(props.connection.session)
  } catch {
    if (!disposed) message.value = 'Pi could not sign in. Reopen the app to reconnect.'
  }
}
void connect()
watch(
  () => identity.value?.user?.id,
  (id) => {
    if (!id) void chat.client.auth.setSession(null).catch(() => {})
  }
)
onBeforeUnmount(() => {
  disposed = true
  void chat.client.auth.setSession(null).catch(() => {})
})
</script>

<template>
  <WispChat
    :chat="chat"
    title="Pi"
    :theme="{
      accent: 'rgb(var(--md-sys-color-primary))',
      primaryForeground: 'rgb(var(--md-sys-color-on-primary))',
      background: 'rgb(var(--md-sys-color-surface))',
      foreground: 'rgb(var(--md-sys-color-on-surface))',
      muted: 'rgb(var(--md-sys-color-on-surface-variant))',
      border: 'rgb(var(--md-sys-color-outline-variant))',
      menuBackground: 'rgb(var(--md-sys-color-surface-container))',
    }"
  />
  <p v-if="message" class="fixed bottom-24 left-4 z-50 max-w-xs rounded bg-surface-container p-3 text-on-surface" role="alert">{{ message }}</p>
</template>

<style>
@media (max-width: 1023px) {
  .wisp-bottom-5 {
    bottom: var(--mobile-navigation-clearance);
  }
  .wisp-floating {
    bottom: var(--mobile-navigation-clearance);
    max-height: calc(100dvh - var(--mobile-navigation-clearance) - env(safe-area-inset-top) - 1rem);
  }
}
</style>
