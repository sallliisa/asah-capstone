<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { invalidateResourceData, ListView, useCollection, useFrameworkQueryClient, useNamespacedQuery } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import Icon from '@southneuhof/loom/components/base/Icon.vue'
import { errorMessage } from '@/framework/adapters/data/normalize'
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
const pushSetupError = ref('')
const pushHelp = computed(() => {
  if (pushState.value === 'blocked') return 'Allow notifications in your browser or device settings.'
  if (pushState.value === 'unsupported') return 'This browser does not support push notifications. On iPhone, add the app to your Home Screen and open it there.'
  return ''
})

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
  pushSetupError.value = ''
  const enabled = pushState.value === 'enabled'
  try {
    if (enabled) await disablePush()
    else await enablePush()
    pushState.value = enabled ? 'available' : 'enabled'
  } catch (error) {
    if (Notification.permission === 'denied') {
      pushState.value = 'blocked'
      return
    }
    toast.error(errorMessage(error, 'Could not update push notifications for this device.'))
    if (enabled)
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
    pushSetupError.value = 'Could not check push setup on this device.'
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

    <template #context>
      <Card v-if="pushState === 'available'" variant="outlined" color="warningContainer" class="gap-2 px-5 py-3 sm:px-6">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div class="flex min-w-0 items-center gap-3">
            <Icon name="error-warning" size="2xl" class="shrink-0" v-bind="{ 'aria-hidden': true }" />
            <p class="text-sm font-medium">Activity reminders are off on this device.</p>
          </div>
          <Button type="button" class="ml-auto shrink-0" :disabled="savingPush" @click="updatePush">Enable notifications</Button>
        </div>
      </Card>
      <Button v-else-if="pushState === 'enabled'" type="button" variant="text" class="self-start" :disabled="savingPush" @click="updatePush">
        <template #icon><Icon name="notification-off" size="base" /></template>
        Turn off notifications
      </Button>
      <p v-else-if="pushHelp" role="status" class="text-sm text-on-surface-variant">{{ pushHelp }}</p>
      <p v-if="pushSetupError" role="alert" class="text-sm text-error">{{ pushSetupError }}</p>
      <p v-if="readError" role="alert" class="text-sm text-error">{{ readError }}</p>
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
