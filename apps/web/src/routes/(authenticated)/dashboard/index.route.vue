<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { z } from 'zod/v4'
import { activityDashboardQuerySchema } from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import { RouterLink } from 'vue-router'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import { defineForm, Form, useCollection, type CollectionLoadContext } from '@southneuhof/loom'
import { resourceCan } from '@/framework/access'
import { rooms } from '../rooms/rooms.resource'
import { roomsActions } from '../rooms/rooms.actions'
import { activities, workStates } from '../activities/activities.resource'
import { activitiesActions } from '../activities/activities.actions'
import { recurringPlans } from '../recurring-plans/recurring-plans.resource'
import { recurringPlansActions } from '../recurring-plans/recurring-plans.actions'
import DashboardCash from './DashboardCash.vue'
import { loadDashboardCash } from './dashboard.actions'
import { permissions } from '@/stores/permissions'
import { loadTenantPriorities } from '../tenant-detector/tenant-detector.actions'

const access = permissions()
const canAssess = computed(() => access.can('view-users') && access.can('view-activities') && access.can('view-rooms'))
const {
  records: priorities,
  loading: prioritiesLoading,
  error: prioritiesError,
  refresh: refreshPriorities,
} = useCollection(() => ({ ...(canAssess.value ? { load: loadTenantPriorities } : { data: [] }), resource: 'tenant-detector', namespace: 'dashboard-priorities' }))
const tenantGrades = computed(() => new Map(priorities.value.map((tenant) => [tenant.tenantId, tenant.prediction?.grade ?? '—'])))

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
const financialFilters = ref<(typeof activityDashboardQuerySchema)['_output']>({ period: 'this-month' })
const cashFilterSchema = z
  .object({ period: activityDashboardQuerySchema.shape.period, from: z.iso.date().nullish(), to: z.iso.date().nullish(), roomId: z.string().nullish() })
  .superRefine((input, context) => {
    if (input.period === 'custom' && (!input.from || !input.to || input.from > input.to)) context.addIssue({ code: 'custom', path: ['from'], message: 'Select a valid start and end date.' })
  })
  .transform((input) => activityDashboardQuerySchema.parse({ ...input, from: input.from ?? undefined, to: input.to ?? undefined, roomId: input.roomId || undefined }))
const cashFilters = defineForm({
  schema: cashFilterSchema,
  fields: {
    period: {
      label: 'Cash period',
      renderer: 'select',
      initialValue: 'this-month',
      props: {
        data: [
          { id: 'this-month', name: 'This month' },
          { id: 'last-month', name: 'Last month' },
          { id: 'last-three-months', name: 'Last three months' },
          { id: 'custom', name: 'Custom dates' },
        ],
        pick: 'id',
        view: 'name',
        clearable: false,
      },
    },
    from: ({ draft }) => ({ label: 'From', renderer: 'date', visible: draft.period === 'custom' }),
    to: ({ draft }) => ({ label: 'To', renderer: 'date', visible: draft.period === 'custom' }),
    roomId: { label: 'Room (empty means all rooms)', renderer: 'select', props: { load: activitiesActions.rooms, pick: 'id', view: 'name', clearable: true } },
  },
})
async function applyCashFilters(input: (typeof cashFilterSchema)['_output']) {
  financialFilters.value = input
}

const canPlans = resourceCan(recurringPlans)
const {
  records: snapshots,
  loading: cashLoading,
  error: cashError,
  refresh: refreshCash,
} = useCollection(() => ({
  ...(canActivities('list') ? { load: loadDashboardCash } : { data: [] }),
  resource: 'activities',
  namespace: 'operational-dashboard',
  query: financialFilters.value,
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
    if (canAssess.value) refreshPriorities()
  }, 60000)
})
onBeforeUnmount(() => clearInterval(interval))
</script>

<template>
  <div class="dashboard-grid">
    <Card class="rooms-panel min-h-0 min-w-0 gap-2 p-3 lg:overflow-auto">
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
              :class="room.occupantId ? 'bg-surface-container-high hover:bg-surface-container-highest' : 'bg-transparent'"
              class="flex h-full w-full items-center justify-center rounded border border-outline-variant overflow-hidden p-1 text-center text-xs font-medium text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              ><span class="flex flex-col"
                ><span class="truncate">{{ room.roomCode }}</span
                ><span v-if="room.occupantId && canAssess" class="text-[10px]">{{ tenantGrades.get(room.occupantId) ?? '—' }}</span></span
              ></RouterLink
            >
          </li>
        </ul>
      </div>
    </Card>
    <Card class="attention-panel min-h-0 min-w-0 gap-2 p-3 lg:overflow-auto">
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
      <section v-if="canAssess" class="flex flex-col gap-2">
        <h3 class="font-semibold">Tenant review priorities ({{ priorities.length }})</h3>
        <p v-if="prioritiesLoading">Loading tenant assessments…</p>
        <p v-else-if="prioritiesError" role="alert">Could not load tenant assessments.</p>
        <p v-else-if="!priorities.length">No tenant assessments yet.</p>
        <ul v-else class="flex flex-col gap-2">
          <li v-for="tenant in priorities.slice(0, 8)" :key="tenant.tenantId">
            <RouterLink :to="{ name: 'settings-users-detail', params: { userId: tenant.tenantId } }" class="text-primary underline">{{ tenant.tenantName }}</RouterLink>
            · {{ tenant.prediction ? (tenant.prediction.grade ?? 'Not enough data') : 'Waiting for assessment' }}
            <span v-if="tenant.error"> · Assessment failed</span>
            <span v-else-if="tenant.pending && tenant.prediction"> · Refresh queued</span>
            <span v-else-if="tenant.stale"> · Records changed</span>
            <p class="text-sm text-on-surface-variant">{{ tenant.rooms.map((room) => room.name).join(', ') }}</p>
          </li>
        </ul>
      </section>
    </Card>
    <Card class="plans-panel min-h-0 min-w-0 gap-2 p-3 lg:overflow-auto">
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
    <section aria-label="Cash overview" class="cash-panel flex min-h-0 min-w-0 flex-col gap-3 lg:overflow-auto">
      <Form v-if="canActivities('list')" v-bind="cashFilters" :submit="applyCashFilters" />
      <p v-if="!canActivities('list')" role="alert">You do not have permission to view activities.</p>
      <p v-else-if="cashLoading" role="status">Loading cash summary…</p>
      <div v-else-if="cashError" role="alert">
        <p>Could not load cash summary.</p>
        <Button type="button" variant="text" @click="refreshCash">Retry</Button>
      </div>
      <DashboardCash v-else-if="snapshot" :snapshot="snapshot" />
    </section>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
.rooms-panel,
.cash-panel {
  grid-column: 1 / -1;
}
@media (min-width: 1024px) {
  :global(div:has(> main .dashboard-grid)) {
    height: 100dvh;
    min-height: 0;
  }
  :global(main:has(.dashboard-grid)) {
    overflow: hidden;
  }
  :global(main:has(.dashboard-grid) > div) {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
  }
  .dashboard-grid {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    grid-template-rows: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 3fr);
  }
}
@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: repeat(12, minmax(0, 1fr));
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
