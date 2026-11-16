<route>{ "meta": { "permission": "view-activities" } }</route>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ListView } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import { rpc } from '@/framework/rpc'
import { notifications } from './notifications.resource'
import { disablePush, enablePush } from './push'

const router = useRouter()
const unread = ref(false)
const busy = ref(false)
const message = ref('')
async function markRead(id?: string) {
  const response = await rpc.notifications.read.$post({ json: id ? { id } : {} })
  if (!response.ok) throw new Error('Could not update notification read state.')
  await notifications.invalidate()
}
async function openActivity(record: { id: string; activityId: string }) {
  try {
    await markRead(record.id)
    await router.push({ name: 'activities-detail', params: { activityId: record.activityId } })
  } catch {
    message.value = 'Could not open this notification. Try again.'
  }
}
async function configurePush(enable: boolean) {
  busy.value = true
  message.value = ''
  try {
    if (enable) await enablePush()
    else await disablePush()
    message.value = enable ? 'Push enabled on this device.' : 'Push disabled on this device.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Could not change push settings.'
  } finally {
    busy.value = false
  }
}
async function markAll() {
  try {
    await markRead()
  } catch {
    message.value = 'Could not mark notifications as read.'
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <ListView v-bind="notifications.list({ searchParameters: { unread: unread ? 'true' : 'false' } })" title="Notifications">
      <template #toolbar>
        <Button variant="text" @click="unread = !unread">{{ unread ? 'Show all' : 'Show unread' }}</Button>
        <Button variant="text" @click="markAll">Mark all as read</Button>
      </template>
      <template #row-actions="{ record }"><Button variant="text" @click="openActivity(record)">Open activity</Button></template>
    </ListView>
    <section class="flex flex-col gap-2">
      <h2 class="text-lg font-semibold">Push notifications on this device</h2>
      <p>On iPhone, add this app to your Home Screen, then enable notifications here.</p>
      <div class="flex flex-wrap gap-2">
        <Button :disabled="busy" @click="configurePush(true)">Enable push notifications</Button>
        <Button variant="text" :disabled="busy" @click="configurePush(false)">Disable push notifications</Button>
      </div>
      <p v-if="message" role="status">{{ message }}</p>
    </section>
  </div>
</template>
