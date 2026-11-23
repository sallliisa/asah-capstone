<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { invalidateResourceData, ListView, useCollection, useFrameworkQueryClient, useNamespacedQuery } from '@southneuhof/loom'
import Alert from '@southneuhof/loom/components/base/Alert.vue'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Icon from '@southneuhof/loom/components/base/Icon.vue'
import { rpc } from '@/framework/rpc'
import { notificationActions, notifications } from './notifications.resource'
import { disablePush, enablePush, pushSupported } from './push'

const queryClient = useFrameworkQueryClient()
const inboxQuery = useNamespacedQuery({ namespace: 'notifications', defaults: { page: 1, limit: 10 } })
const unreadOnly = computed(() => inboxQuery.values.value.unread === 'true')
const inbox = computed(() => {
  const list = notifications.list()
  return { ...list, table: { ...list.table, query: inboxQuery.values.value } }
})
const { records: unreadCounts } = useCollection(() => ({
  load: notificationActions.unread,
  resource: notifications.key,
  namespace: 'unread-count',
  query: {},
  searchParameters: {},
}))
const unreadCount = computed(() => unreadCounts.value[0]?.unread ?? 0)
const markingRead = ref(new Set<string | undefined>())
const readError = ref('')
const pushState = ref<'checking' | 'unsupported' | 'blocked' | 'available' | 'enabled'>('checking')
const savingPush = ref(false)
const pushError = ref('')

function toggleUnread() {
  inboxQuery.update({ unread: unreadOnly.value ? undefined : 'true', page: 1 })
}

async function markRead(id?: string) {
  if (markingRead.value.has(id)) return
  markingRead.value.add(id)
  readError.value = ''
  try {
    const response = await rpc.notifications.read.$post({ json: id ? { id } : {} })
    if (!response.ok) throw new Error('Could not mark notifications as read.')
    await invalidateResourceData(queryClient, { resource: notifications.key })
  } catch {
    readError.value = 'Could not update the inbox. Refresh the page to check which notifications are unread.'
  } finally {
    markingRead.value.delete(id)
  }
}

async function readPushState() {
  if (!pushSupported()) {
    pushState.value = 'unsupported'
  } else if (Notification.permission === 'denied') {
    pushState.value = 'blocked'
  } else {
    const registration = await navigator.serviceWorker.getRegistration('/')
    const subscription = await registration?.pushManager.getSubscription()
    pushState.value = Notification.permission === 'granted' && subscription ? 'enabled' : 'available'
  }
}

async function updatePush() {
  if (savingPush.value) return
  savingPush.value = true
  pushError.value = ''
  const enabled = pushState.value === 'enabled'
  try {
    if (enabled) await disablePush()
    else await enablePush()
    pushState.value = enabled ? 'available' : 'enabled'
  } catch (error) {
    pushError.value = error instanceof Error ? error.message : 'Could not update push notifications for this device.'
    if (Notification.permission === 'denied') pushState.value = 'blocked'
    else if (enabled)
      await readPushState().catch(() => {
        pushState.value = 'available'
      })
  } finally {
    savingPush.value = false
  }
}

onMounted(async () => {
  try {
    await readPushState()
  } catch {
    pushState.value = 'available'
    pushError.value = 'Could not check push setup on this device.'
  }
})
</script>

<template>
  <ListView v-bind="inbox" title="Notifications" :export="false" @update:query="inboxQuery.replace">
    <template #resource-action>
      <div class="flex flex-wrap justify-end gap-2">
        <Button type="button" v-bind="{ variant: unreadOnly ? 'filled' : 'outlined', 'aria-current': unreadOnly ? 'true' : undefined }" @click="toggleUnread">
          <template #icon><Icon name="filter" size="base" /></template>
          Unread only
        </Button>
        <Button type="button" variant="tonal" :disabled="markingRead.has(undefined) || unreadCount === 0" @click="markRead()">
          <template #icon><Icon name="check-double" size="base" /></template>
          Mark all as read
        </Button>
      </div>
    </template>

    <template #context="{ error }">
      <div v-if="!error && (pushState !== 'checking' || readError)" class="grid gap-2">
        <Alert v-if="pushState === 'available'" type="warning">
          <section class="flex flex-wrap items-center gap-3">
            <div>
              <h2 class="font-semibold">Push notifications are off</h2>
              <p class="mt-1 text-sm">Get a reminder on this device when an activity is due.</p>
            </div>
            <Button type="button" color="warning" class="h-auto min-h-10 whitespace-normal py-2 text-center" :disabled="savingPush" @click="updatePush">
              <template #icon><Icon name="notification" size="base" /></template>
              Enable push notifications on this device
            </Button>
          </section>
        </Alert>
        <section v-else-if="pushState === 'enabled'" class="flex flex-wrap items-center gap-2 text-sm">
          <p role="status">Push notifications are on for this device.</p>
          <Button type="button" variant="text" :disabled="savingPush" @click="updatePush">
            <template #icon><Icon name="notification-off" size="base" /></template>
            Turn off push notifications
          </Button>
        </section>
        <Alert v-else-if="pushState === 'blocked'" type="info">
          <p>Notifications are blocked. To enable push, allow notifications in your device settings.</p>
        </Alert>
        <Alert v-else-if="pushState === 'unsupported'" type="info">
          <p>On iPhone, add this app to the Home Screen and open it there to enable notifications.</p>
        </Alert>
        <p v-if="pushError" role="alert" class="text-sm text-error">{{ pushError }}</p>
        <p v-if="readError" role="alert" class="text-sm text-error">{{ readError }}</p>
      </div>
    </template>

    <template #cell:title="{ record }">
      <RouterLink
        class="font-medium text-primary underline underline-offset-2"
        :to="{ name: 'activities-detail', params: { activityId: record.activityId } }"
        @click="!record.readAt && markRead(record.id)"
      >
        {{ record.title }}
      </RouterLink>
    </template>
    <template #cell:readAt="{ record, value }">
      <span v-if="record.readAt">{{ value }}</span>
      <span v-else class="font-semibold text-primary">Unread</span>
    </template>
    <template #row-actions="{ record }">
      <Button v-if="!record.readAt" type="button" kind="icon" variant="standard" :ariaLabel="`Mark ${record.title} as read`" :disabled="markingRead.has(record.id)" @click="markRead(record.id)">
        <template #icon><Icon name="check" size="base" /></template>
      </Button>
    </template>
  </ListView>
</template>
