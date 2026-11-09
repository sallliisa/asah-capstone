<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import { useCollection, type CollectionLoadContext } from '@southneuhof/loom'
import { resourceCan } from '@/framework/access'
import { rooms } from '../rooms/rooms.resource'
import { roomsActions } from '../rooms/rooms.actions'
import { activities, workStates } from '../activities/activities.resource'
import { activitiesActions } from '../activities/activities.actions'
import { recurringPlans } from '../recurring-plans/recurring-plans.resource'
import { recurringPlansActions } from '../recurring-plans/recurring-plans.actions'
import DashboardCash from './DashboardCash.vue'

const can = resourceCan(rooms)
async function loadRooms(context: CollectionLoadContext) {
  const records: Awaited<ReturnType<typeof roomsActions.list>>['data'] = []
  let page = 1
  while (true) {
    const result = await roomsActions.list({ ...context, query: { page, limit: 100, sort_by: 'roomCode', sort: 'asc' } })
    records.push(...result.data)
    if (!result.data.length || records.length >= (result.meta?.total ?? records.length)) break
    page += 1
  }
  return { data: records.sort((left, right) => left.roomCode.localeCompare(right.roomCode, undefined, { numeric: true })) }
}
const { records, loading, error, refresh } = useCollection(() => ({
  ...(can('list') ? { load: loadRooms } : { data: [] }),
  resource: 'rooms',
  namespace: 'room-map',
}))
const canActivities = resourceCan(activities)
const canPlans = resourceCan(recurringPlans)
const {
  records: snapshots,
  loading: cashLoading,
  error: cashError,
  refresh: refreshCash,
} = useCollection(() => ({
  ...(canActivities('list') ? { load: activitiesActions.dashboard } : { data: [] }),
  resource: 'activities',
  namespace: 'operational-dashboard',
  query: {},
}))
const snapshot = computed(() => snapshots.value[0])
const {
  records: upcoming,
  meta: upcomingMeta,
  loading: plansLoading,
  error: plansError,
  refresh: refreshPlans,
} = useCollection(() => ({
  ...(canPlans('list') ? { load: recurringPlansActions.upcoming } : { data: [] }),
  resource: 'recurring-plans',
  namespace: 'dashboard-upcoming',
  query: {},
}))
const upcomingTotal = computed(() => upcomingMeta.value?.total ?? upcoming.value.length)
const money = (value: number) => `Rp ${value.toLocaleString('id-ID')}`
let interval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  interval = setInterval(() => {
    if (canActivities('list')) refreshCash()
    if (canPlans('list')) refreshPlans()
  }, 60000)
})
onBeforeUnmount(() => clearInterval(interval))
</script>

<template>
  <div class="dashboard-grid">
    <Card variant="outlined" color="surfaceContainerLowest" class="rooms-panel min-w-0 gap-4 p-4">
      <h2 class="text-base font-semibold">Rooms</h2>
      <div class="flex justify-center">
        <p v-if="!can('list')" role="alert">You do not have permission to view rooms.</p>
        <p v-else-if="loading" role="status">Loading rooms…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-2" role="alert">
          <p>Could not load rooms.</p>
          <Button type="button" variant="text" @click="refresh">Retry</Button>
        </div>
        <div v-else-if="!records.length" class="flex flex-col items-center gap-2">
          <p>No rooms yet.</p>
          <RouterLink v-if="can('create')" :to="{ name: 'rooms-create' }" class="text-primary underline">Create Room</RouterLink>
        </div>
        <ul v-else class="room-map" aria-label="Rooms">
          <li v-for="room in records" :key="room.id" class="aspect-square min-w-0">
            <RouterLink
              :to="{ name: 'rooms-detail', params: { roomId: room.id } }"
              :aria-label="`${room.roomCode}: ${room.name}, ${room.occupantId ? 'Occupied' : 'Unoccupied'}`"
              :class="room.occupantId ? 'bg-surface-container hover:bg-surface-container-high' : 'bg-transparent'"
              class="flex h-full w-full items-center justify-center rounded border border-outline-variant overflow-hidden p-1 text-center text-xs font-medium text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              ><span class="truncate">{{ room.roomCode }}</span></RouterLink
            >
          </li>
        </ul>
      </div>
    </Card>
    <Card variant="outlined" color="surfaceContainerLowest" class="attention-panel min-w-0 gap-4 p-4">
      <h2 class="text-base font-semibold">
        Needs attention <span v-if="snapshot" class="text-sm font-normal text-on-surface-variant">({{ snapshot.attention.total }})</span>
      </h2>
      <p v-if="!canActivities('list')" role="alert">You do not have permission to view activities.</p>
      <p v-else-if="cashLoading" role="status">Loading activities…</p>
      <div v-else-if="cashError" role="alert">
        <p>Could not load activities.</p>
        <Button type="button" variant="text" @click="refreshCash">Retry</Button>
      </div>
      <template v-else-if="snapshot">
        <p v-if="!snapshot.attention.items.length" class="text-sm text-on-surface-variant">No activities need attention.</p>
        <ul v-else class="divide-y divide-outline-variant">
          <li v-for="activity in snapshot.attention.items" :key="activity.id" class="py-3 first:pt-0">
            <RouterLink :to="{ name: 'activities-detail', params: { activityId: activity.id } }" class="break-words font-medium text-primary underline">{{ activity.name }}</RouterLink>
            <p class="mt-1 text-sm text-on-surface-variant">{{ activity.roomName ?? 'Shared' }} · {{ activity.categoryName }}</p>
            <p class="mt-1 text-sm">
              {{ `Work ${workStates.find((state) => state.id === activity.workStatus)?.name.toLowerCase()}`
              }}<template v-if="activity.paymentStatus === 'draft'">
                · {{ activity.financialKind === 'income' ? 'Income expected' : 'Payment needed' }}<template v-if="activity.amount !== null"> {{ money(activity.amount) }}</template></template
              >
            </p>
            <p v-if="activity.expectedDate" class="mt-1 text-sm" :class="activity.overdue ? 'font-medium text-error' : 'text-on-surface-variant'">
              {{ activity.overdue ? 'Overdue' : 'Expected' }} {{ activity.expectedDate }}
            </p>
          </li>
        </ul>
        <RouterLink v-if="snapshot.attention.total > snapshot.attention.items.length" :to="{ name: 'activities' }" class="text-sm text-primary underline">View all activities</RouterLink>
      </template>
    </Card>
    <Card variant="outlined" color="surfaceContainerLowest" class="plans-panel min-w-0 gap-4 p-4">
      <h2 class="text-base font-semibold">
        Upcoming plans <span v-if="!plansLoading && !plansError && canPlans('list')" class="text-sm font-normal text-on-surface-variant">({{ upcomingTotal }})</span>
      </h2>
      <p v-if="!canPlans('list')" role="alert">You do not have permission to view recurring plans.</p>
      <p v-else-if="plansLoading" role="status">Loading plans…</p>
      <div v-else-if="plansError" role="alert">
        <p>Could not load plans.</p>
        <Button type="button" variant="text" @click="refreshPlans">Retry</Button>
      </div>
      <template v-else>
        <p class="text-sm text-on-surface-variant">Next 7 days</p>
        <p v-if="!upcoming.length" class="text-sm text-on-surface-variant">No upcoming plans.</p>
        <ul v-else class="divide-y divide-outline-variant">
          <li v-for="plan in upcoming" :key="`${plan.planId}-${plan.expectedDate}`" class="py-3 first:pt-0">
            <RouterLink :to="{ name: 'recurring-plans-detail', params: { planId: plan.planId } }" class="break-words font-medium text-primary underline">{{ plan.name }}</RouterLink>
            <p class="mt-1 text-sm text-on-surface-variant">{{ plan.roomName ?? 'Shared' }} · {{ plan.categoryName }}</p>
            <p class="mt-1 text-sm">Expected {{ plan.expectedDate }}</p>
            <p v-if="plan.amount !== null" class="mt-1 text-sm">{{ plan.financialKind === 'income' ? 'Income' : 'Expense' }} {{ money(plan.amount) }}</p>
          </li>
        </ul>
        <RouterLink v-if="upcomingTotal > upcoming.length" :to="{ name: 'recurring-plans' }" class="text-sm text-primary underline">View all recurring plans</RouterLink>
      </template>
    </Card>
    <Card variant="outlined" color="surfaceContainerLowest" class="cash-panel min-w-0 gap-4 p-4">
      <h2 class="text-base font-semibold">This month's cash</h2>
      <p v-if="!canActivities('list')" role="alert">You do not have permission to view activities.</p>
      <p v-else-if="cashLoading" role="status">Loading cash summary…</p>
      <div v-else-if="cashError" role="alert">
        <p>Could not load cash summary.</p>
        <Button type="button" variant="text" @click="refreshCash">Retry</Button>
      </div>
      <DashboardCash v-else-if="snapshot" :snapshot="snapshot" />
    </Card>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}
@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: repeat(12, minmax(5rem, 1fr));
  }
  .rooms-panel {
    grid-column: 1 / 7;
    grid-row: 1 / 5;
  }
  .attention-panel {
    grid-column: 1 / 4;
    grid-row: 5 / 13;
  }
  .plans-panel {
    grid-column: 4 / 7;
    grid-row: 5 / 13;
  }
  .cash-panel {
    grid-column: 7 / 13;
    grid-row: 1 / 13;
  }
}
.room-map {
  display: grid;
  width: 100%;
  max-width: 32rem;
  grid-template-columns: repeat(auto-fit, minmax(min(2.75rem, 100%), 2.75rem));
  justify-content: center;
  gap: 0.5rem;
}
</style>
