<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useCollection, type CollectionLoadContext } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import Icon from '@southneuhof/loom/components/base/Icon.vue'
import Popover from '@southneuhof/loom/components/base/Popover.vue'
import { resourceCan } from '@/framework/access'
import { permissions } from '@/stores/permissions'
import { activities } from '../activities/activities.resource'
import { recurringPlansActions } from '../recurring-plans/recurring-plans.actions'
import { recurringPlans } from '../recurring-plans/recurring-plans.resource'
import { roomsActions } from '../rooms/rooms.actions'
import { rooms } from '../rooms/rooms.resource'
import TenantGradeChip from '../tenant-detector/TenantGradeChip.vue'
import { isTenantGrade, tenantGradeLabels } from '../tenant-detector/grade-display'
import { loadTenantPriorities } from '../tenant-detector/tenant-detector.actions'
import DashboardCash from './DashboardCash.vue'
import { loadDashboardCash } from './dashboard.actions'

type Room = Awaited<ReturnType<typeof roomsActions.list>>['data'][number]
type TenantPriority = Awaited<ReturnType<typeof loadTenantPriorities>>['data'][number]
type TenantPrediction = NonNullable<TenantPriority['prediction']>

const access = permissions()
const canRooms = resourceCan(rooms)
const canActivities = resourceCan(activities)
const canPlans = resourceCan(recurringPlans)
const canAssess = computed(() => canRooms('list') && access.can('view-users') && access.can('view-activities'))

async function loadRooms(context: CollectionLoadContext) {
  const records: Room[] = []
  let page = 1
  while (true) {
    const result = await roomsActions.list({ ...context, query: { page, limit: 100, sort_by: 'roomCode', sort: 'asc' } })
    records.push(...result.data)
    if (!result.data.length || records.length >= (result.meta?.total ?? records.length)) break
    page += 1
  }
  return { data: records.sort((left, right) => left.roomCode.localeCompare(right.roomCode, undefined, { numeric: true })) }
}

const {
  records: roomRecords,
  loading: roomsLoading,
  error: roomsError,
  refresh: refreshRooms,
} = useCollection(() => ({
  ...(canRooms('list') ? { load: loadRooms } : { data: [] }),
  resource: 'rooms',
  namespace: 'room-map',
}))
const {
  records: priorities,
  loading: prioritiesLoading,
  error: prioritiesError,
  refresh: refreshPriorities,
} = useCollection(() => ({
  ...(canAssess.value ? { load: loadTenantPriorities } : { data: [] }),
  resource: 'tenant-detector',
  namespace: 'dashboard-priorities',
}))
const {
  records: snapshots,
  loading: cashLoading,
  error: cashError,
  refresh: refreshCash,
} = useCollection(() => ({
  ...(canActivities('list') ? { load: loadDashboardCash } : { data: [] }),
  resource: 'activities',
  namespace: 'operational-dashboard',
  query: { period: 'this-month' },
}))
const {
  records: upcomingPlans,
  loading: plansLoading,
  error: plansError,
  refresh: refreshPlans,
} = useCollection(() => ({
  ...(canPlans('list') ? { load: recurringPlansActions.upcoming } : { data: [] }),
  resource: 'recurring-plans',
  namespace: 'dashboard-upcoming',
  query: {},
}))

const roomStatusLabels = {
  vacant: 'Vacant',
  occupied: 'Occupied',
  unassessed: 'Grade unavailable',
  A: tenantGradeLabels.A,
  B: tenantGradeLabels.B,
  C: tenantGradeLabels.C,
}
type RoomStatus = keyof typeof roomStatusLabels

type AssessmentSignals = ReturnType<typeof assessmentSignals>

const followUpKinds = [
  { id: 'overdue-rent', label: 'Overdue rent', matches: ({ overdueDays }: AssessmentSignals) => overdueDays > 0 },
  { id: 'late-rent', label: 'Rent paid late', matches: ({ averageLateDays }: AssessmentSignals) => averageLateDays > 0 },
  { id: 'week-late-rent', label: 'Rent averaged 7+ days late', matches: ({ averageLateDays }: AssessmentSignals) => averageLateDays >= 7 },
  { id: 'one-repair', label: '1 repair in 90 days', matches: ({ repairs }: AssessmentSignals) => repairs === 1 },
  { id: 'repairs', label: '2+ repairs in 90 days', matches: ({ repairs }: AssessmentSignals) => repairs >= 2 },
  { id: 'extra-cleaning', label: 'Extra cleaning in 90 days', matches: ({ extraCleanings }: AssessmentSignals) => extraCleanings > 0 },
] as const
type FollowUpKind = (typeof followUpKinds)[number]['id']

const selectedRoomFilter = ref<RoomStatus | FollowUpKind>()
const assessmentsReady = computed(() => canAssess.value && !prioritiesLoading.value && !prioritiesError.value)
const tenantPriorities = computed(() => (canAssess.value && !prioritiesError.value ? new Map(priorities.value.map((priority) => [priority.tenantId, priority])) : new Map<string, TenantPriority>()))
const roomMap = computed(() =>
  roomRecords.value.map((room) => {
    const prediction = room.occupantId ? tenantPriorities.value.get(room.occupantId)?.prediction : null
    const status = room.occupantId === null ? 'vacant' : (prediction?.grade ?? (assessmentsReady.value ? 'unassessed' : 'occupied'))
    const signals = prediction && (status === 'B' || status === 'C') ? assessmentSignals(prediction) : null
    return { ...room, status, prediction, signals }
  })
)
const roomCounts = computed(() => {
  const counts = { vacant: 0, occupied: 0, unassessed: 0, A: 0, B: 0, C: 0 }
  for (const room of roomMap.value) counts[room.status] += 1
  return counts
})
const occupiedCount = computed(() => roomMap.value.length - roomCounts.value.vacant)
const visibleRoomStatuses = computed(() => (['C', 'B', 'A', 'unassessed', 'vacant'] as const).filter((status) => roomCounts.value[status] > 0))
const followUpGroups = computed(() =>
  followUpKinds.map((kind) => {
    const tenants = new Set<string>()
    for (const room of roomMap.value) {
      if (room.occupantId && room.signals && kind.matches(room.signals)) tenants.add(room.occupantId)
    }
    return { ...kind, tenants }
  })
)
const activeRoomFilter = computed(() => {
  const filter = selectedRoomFilter.value
  return visibleRoomStatuses.value.some((status) => status === filter) || followUpGroups.value.some((group) => group.id === filter && group.tenants.size > 0) ? filter : undefined
})
const activeFollowUp = computed(() => followUpGroups.value.find((group) => group.id === activeRoomFilter.value))
const highlightedRooms = computed(() => {
  if (!activeRoomFilter.value) return null
  const group = activeFollowUp.value
  return new Set(roomMap.value.filter((room) => (group ? room.occupantId && group.tenants.has(room.occupantId) : room.status === activeRoomFilter.value)).map((room) => room.id))
})

function toggleRoomFilter(filter: RoomStatus | FollowUpKind) {
  selectedRoomFilter.value = activeRoomFilter.value === filter ? undefined : filter
}
const snapshot = computed(() => snapshots.value[0])
const openTasks = computed(() => snapshot.value?.attention.items.slice(0, 2) ?? [])
const nextActivities = computed(() => {
  const taskIds = new Set(openTasks.value.map((task) => task.id))
  return snapshot.value?.upcoming.filter((activity) => !taskIds.has(activity.id)) ?? []
})
const taskPreview = computed(() => {
  const scheduledIds = new Set(nextActivities.value.map((activity) => activity.id))
  const additional = snapshot.value?.attention.items.slice(2).filter((task) => !scheduledIds.has(task.id)) ?? []
  return [...openTasks.value, ...additional]
})
const hasWork = computed(() => canActivities('list') || canPlans('list'))

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const fullDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function assessmentSignals(prediction: TenantPrediction) {
  const facts = new Map(prediction.facts.map((fact) => [fact.kind, fact.value]))
  return {
    overdueDays: facts.get('oldestUnpaidDays') ?? 0,
    averageLateDays: prediction.features?.meanSettledLateDays ?? 0,
    repairs: facts.get('repairs90') ?? 0,
    extraCleanings: facts.get('extraCleaning90') ?? 0,
  }
}

function assessmentObservations({ overdueDays: overdue, averageLateDays: late, repairs, extraCleanings: cleanings }: AssessmentSignals) {
  const averageLateDays = Math.floor(late * 10) / 10
  return [
    overdue > 0 ? `Rent was overdue by ${overdue} ${overdue === 1 ? 'day' : 'days'}` : null,
    late > 0 ? `Late rent payments averaged ${averageLateDays} ${averageLateDays === 1 ? 'day' : 'days'} late` : null,
    repairs > 0 ? `${repairs} ${repairs === 1 ? 'repair' : 'repairs'} in 90 days` : null,
    cleanings > 0 ? `${cleanings} extra ${cleanings === 1 ? 'cleaning' : 'cleanings'} in 90 days` : null,
  ].filter((observation) => observation !== null)
}

let interval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  interval = setInterval(() => {
    void Promise.allSettled([canRooms('list') && refreshRooms(), canActivities('list') && refreshCash(), canPlans('list') && refreshPlans(), canAssess.value && refreshPriorities()])
  }, 60000)
})
onBeforeUnmount(() => clearInterval(interval))
</script>

<template>
  <div class="property-dashboard">
    <div class="dashboard-operations">
      <header class="dashboard-heading">
        <h1 class="flex items-center gap-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          <span aria-hidden="true" class="inline-flex"><Icon name="home" size="2xl" /></span>
          Dashboard
        </h1>
        <time v-if="canActivities('list') && snapshot" :datetime="snapshot.today" class="dashboard-date">{{ fullDate.format(new Date(snapshot.today)) }}</time>
      </header>
      <div class="dashboard-grid">
        <section v-if="canRooms('list')" aria-labelledby="occupancy-heading" class="occupancy-section min-w-0">
          <Card variant="outlined" color="surfaceContainerLowest" class="overview-card gap-2 p-3 sm:p-4">
            <div class="section-heading">
              <h2 id="occupancy-heading">Room occupancy</h2>
              <RouterLink :to="{ name: 'rooms' }" class="dashboard-link">
                All rooms <span aria-hidden="true" class="inline-flex"><Icon name="arrow-right" size="sm" /></span>
              </RouterLink>
            </div>
            <p v-if="roomsError" class="state" role="alert">Could not load rooms. <Button type="button" variant="text" @click="refreshRooms">Retry</Button></p>
            <p v-else-if="roomsLoading && !roomRecords.length" class="state" role="status">Loading rooms…</p>
            <p v-else-if="!roomRecords.length" class="state">No rooms yet. <RouterLink v-if="canRooms('create')" :to="{ name: 'rooms-create' }" class="dashboard-link">Create room</RouterLink></p>
            <template v-else>
              <p v-if="canAssess && prioritiesError" class="state" role="alert">Could not load tenant grades. <Button type="button" variant="text" @click="refreshPriorities">Retry</Button></p>
              <p v-else-if="canAssess && prioritiesLoading && !priorities.length" class="state" role="status">Loading tenant grades…</p>
              <div class="occupancy-content">
                <ul id="room-map" class="room-map" aria-label="Rooms">
                  <li v-for="room in roomMap" :key="room.id" class="min-w-0">
                    <Popover content-class="w-56 gap-2 p-3 shadow-elevation-2">
                      <template #trigger>
                        <Button
                          type="button"
                          variant="outlined"
                          class="room-tile"
                          v-bind="{ 'data-tenant-grade': room.prediction?.grade ?? undefined }"
                          :class="[`room-status-${room.status}`, { 'room-muted': highlightedRooms && !highlightedRooms.has(room.id) }]"
                        >
                          <span class="sr-only">Room </span><span class="room-number">{{ room.roomCode }}</span
                          ><span class="sr-only">, {{ roomStatusLabels[room.status] }}</span>
                        </Button>
                      </template>
                      <template #content>
                        <p class="font-semibold">Room {{ room.roomCode }}</p>
                        <p v-if="room.occupantName" class="text-sm">{{ room.occupantName }}</p>
                        <TenantGradeChip v-if="room.prediction?.grade" :grade="room.prediction.grade" />
                        <p v-else class="text-sm text-on-surface-variant">{{ roomStatusLabels[room.status] }}</p>
                        <div v-if="room.prediction && room.signals && Object.values(room.signals).some((value) => value > 0)" class="space-y-1 text-xs text-on-surface-variant">
                          <p>
                            Assessed <time :datetime="room.prediction.asOfDate">{{ fullDate.format(new Date(room.prediction.asOfDate)) }}</time>
                          </p>
                          <ul>
                            <li v-for="observation in assessmentObservations(room.signals)" :key="observation">{{ observation }}</li>
                          </ul>
                        </div>
                        <RouterLink v-if="canRooms('detail')" :to="{ name: 'rooms-detail', params: { roomId: room.id } }" class="dashboard-link self-start">
                          Room details <span aria-hidden="true" class="inline-flex"><Icon name="arrow-right" size="sm" /></span>
                        </RouterLink>
                      </template>
                    </Popover>
                  </li>
                </ul>
                <div class="room-key">
                  <dl class="occupancy-counts">
                    <div>
                      <dt>Occupied</dt>
                      <dd>{{ occupiedCount }}</dd>
                    </div>
                    <div>
                      <dt>Vacant</dt>
                      <dd>{{ roomCounts.vacant }}</dd>
                    </div>
                  </dl>
                  <ul v-if="visibleRoomStatuses.length" class="room-legend" aria-label="Room status legend">
                    <li v-for="status in visibleRoomStatuses" :key="status">
                      <button type="button" class="legend-button" :aria-pressed="activeRoomFilter === status" aria-controls="room-map" @click="toggleRoomFilter(status)">
                        <span class="grade-swatch" :class="`room-status-${status}`" v-bind="{ 'data-tenant-grade': isTenantGrade(status) ? status : undefined }" aria-hidden="true"></span>
                        <span>{{ roomStatusLabels[status] }}</span>
                        <strong>{{ roomCounts[status] }}</strong>
                      </button>
                    </li>
                  </ul>
                </div>
                <section v-if="roomCounts.B || roomCounts.C" class="room-follow-up" aria-labelledby="room-follow-up-heading">
                  <h3 id="room-follow-up-heading">Follow-up for flagged tenants</h3>
                  <ul class="follow-up-groups">
                    <li v-for="group in followUpGroups" :key="group.id">
                      <button
                        type="button"
                        class="legend-button follow-up-button"
                        :disabled="!group.tenants.size"
                        :aria-pressed="activeRoomFilter === group.id"
                        aria-controls="room-map"
                        @click="toggleRoomFilter(group.id)"
                      >
                        <span class="follow-up-label">{{ group.label }}</span>
                        <span class="follow-up-count"
                          ><strong>{{ group.tenants.size }}</strong> {{ group.tenants.size === 1 ? 'tenant' : 'tenants' }}</span
                        >
                      </button>
                    </li>
                  </ul>
                </section>
                <Button v-if="activeFollowUp" class="clear-follow-up" type="button" variant="text" @click="selectedRoomFilter = undefined"> Clear map filter </Button>
              </div>
            </template>
          </Card>
        </section>

        <section v-if="canActivities('list')" aria-labelledby="work-heading" class="min-w-0">
          <Card variant="outlined" color="surfaceContainerLowest" class="overview-card agenda-card h-full gap-2 p-3 sm:p-4">
            <div class="section-heading">
              <h2 id="work-heading">
                Open tasks <span v-if="snapshot" class="task-count">({{ snapshot.attention.total }})</span>
              </h2>
              <RouterLink :to="{ name: 'activities', query: { 'activities.openTasks': 'true', 'activities.sort_by': 'dueDate', 'activities.sort': 'asc' } }" class="dashboard-link">
                All tasks <span aria-hidden="true" class="inline-flex"><Icon name="arrow-right" size="sm" /></span>
              </RouterLink>
            </div>
            <p v-if="cashError" class="state" role="alert">
              {{ snapshot ? 'Could not refresh activities.' : 'Could not load activities.' }}
              <Button type="button" variant="text" @click="refreshCash">Retry</Button>
            </p>
            <p v-else-if="cashLoading && !snapshot" class="state" role="status">Loading open tasks…</p>
            <ul v-if="taskPreview.length" class="agenda-list" aria-labelledby="work-heading" :tabindex="0">
              <li v-for="task in taskPreview" :key="task.id">
                <RouterLink v-if="canActivities('detail')" :to="{ name: 'activities-detail', params: { activityId: task.id } }" class="record-link">{{ task.name }}</RouterLink>
                <span v-else>{{ task.name }}</span>
                <p class="agenda-date">
                  <template v-if="task.roomName">Room {{ task.roomName }} · </template>
                  <template v-if="task.expectedDate">
                    <span :class="{ 'font-semibold text-error': task.overdue }">
                      {{ task.overdue ? 'Overdue' : 'Due' }}
                      <time :datetime="task.expectedDate">{{ shortDate.format(new Date(task.expectedDate)) }}</time>
                    </span>
                  </template>
                  <template v-else>No due date</template>
                </p>
              </li>
            </ul>
          </Card>
        </section>

        <section v-if="hasWork" aria-labelledby="schedule-heading" class="schedule-section min-w-0">
          <Card variant="outlined" color="surfaceContainerLowest" class="overview-card agenda-card h-full gap-2 p-3 sm:p-4">
            <div class="section-heading">
              <h2 id="schedule-heading">Upcoming schedule</h2>
              <RouterLink v-if="canPlans('list')" :to="{ name: 'recurring-plans' }" class="dashboard-link">
                All plans <span aria-hidden="true" class="inline-flex"><Icon name="arrow-right" size="sm" /></span>
              </RouterLink>
            </div>
            <div class="schedule-grid">
              <div v-if="canActivities('list')">
                <h3 id="schedule-activities-heading">Activities</h3>
                <ul v-if="nextActivities.length" class="agenda-list" aria-labelledby="schedule-activities-heading" :tabindex="0">
                  <li v-for="activity in nextActivities" :key="activity.id">
                    <RouterLink v-if="canActivities('detail')" :to="{ name: 'activities-detail', params: { activityId: activity.id } }" class="record-link">{{ activity.name }}</RouterLink>
                    <span v-else>{{ activity.name }}</span>
                    <p class="agenda-date">
                      <template v-if="activity.roomName">Room {{ activity.roomName }} · </template>
                      <time :datetime="activity.expectedDate">{{ shortDate.format(new Date(activity.expectedDate)) }}</time>
                    </p>
                  </li>
                </ul>
                <p v-else-if="snapshot" class="state">{{ snapshot.upcoming.length ? 'All scheduled activities are shown under Open tasks.' : 'No upcoming activities.' }}</p>
                <p v-else-if="cashError" class="state">Activities unavailable.</p>
                <p v-else-if="cashLoading" class="state" role="status">Loading activities…</p>
              </div>
              <div v-if="canPlans('list')">
                <h3 id="schedule-plans-heading">Recurring plans <span class="schedule-window">Next 7 days</span></h3>
                <p v-if="plansError" class="state" role="alert">Could not load plans. <Button type="button" variant="text" @click="refreshPlans">Retry</Button></p>
                <p v-else-if="plansLoading && !upcomingPlans.length" class="state" role="status">Loading plans…</p>
                <ul v-else-if="upcomingPlans.length" class="agenda-list" aria-labelledby="schedule-plans-heading" :tabindex="0">
                  <li v-for="plan in upcomingPlans" :key="`${plan.planId}-${plan.expectedDate}`">
                    <RouterLink v-if="canPlans('detail')" :to="{ name: 'recurring-plans-detail', params: { planId: plan.planId } }" class="record-link">{{ plan.name }}</RouterLink>
                    <span v-else>{{ plan.name }}</span>
                    <p class="agenda-date">
                      <template v-if="plan.roomName">Room {{ plan.roomName }} · </template>
                      <time :datetime="plan.expectedDate">{{ shortDate.format(new Date(plan.expectedDate)) }}</time>
                    </p>
                  </li>
                </ul>
                <p v-else class="state">No plans due.</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
      <p v-if="!canRooms('list') && !hasWork" role="status" class="state">You do not have access to property records.</p>
    </div>

    <DashboardCash v-if="canActivities('list')" />
  </div>
</template>

<style scoped>
.property-dashboard {
  display: grid;
  gap: 1rem;
  container-type: inline-size;
}
.dashboard-operations {
  display: grid;
  align-content: start;
  gap: 0.75rem;
}
.dashboard-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr);
}
.dashboard-heading,
.section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
}
.section-heading h2 {
  @apply text-base font-semibold sm:text-lg;
}
.dashboard-date,
.state {
  @apply text-sm text-on-surface-variant;
}
.dashboard-link {
  @apply inline-flex min-h-6 items-center gap-1 text-sm font-medium text-primary hover:underline;
}
.occupancy-content {
  display: grid;
  align-items: start;
  gap: 0.75rem 1.5rem;
}
.room-map {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(2.25rem, 100%), 1fr));
  gap: 0.25rem;
}
.room-tile {
  @apply h-auto min-h-8 w-full min-w-0 rounded-md px-0.5 py-1 text-xs font-semibold leading-tight whitespace-normal tabular-nums [overflow-wrap:anywhere];
}
.room-tile:not([data-tenant-grade]) {
  @apply border-outline-variant text-on-surface;
}
.grade-swatch:not([data-tenant-grade]) {
  @apply border-outline-variant;
}
.room-status-vacant {
  @apply border-dashed text-on-surface-variant;
}
.room-status-unassessed {
  @apply bg-surface-container-highest;
}
.room-tile.room-muted:not(:hover, :focus-visible) {
  @apply border-outline-variant bg-transparent text-on-surface-variant;
}
.room-key {
  @apply grid gap-1.5 text-xs tabular-nums;
}
.occupancy-counts {
  @apply flex flex-wrap gap-x-4 gap-y-1;
}
.occupancy-counts > div {
  @apply flex items-baseline gap-1.5;
}
.occupancy-counts dd {
  @apply font-semibold text-on-surface;
}
.room-legend {
  @apply flex flex-wrap gap-1;
}
.legend-button {
  @apply flex min-h-6 w-full items-center gap-1.5 rounded-md px-1 text-left text-on-surface-variant hover:bg-surface-container;
}
.legend-button[aria-pressed='true'] {
  @apply bg-surface-container-high text-on-surface;
}
.legend-button strong {
  @apply ml-auto font-semibold text-on-surface;
}
.grade-swatch {
  @apply size-2.5 shrink-0 rounded-sm border;
}
.room-follow-up {
  display: none;
}
.clear-follow-up {
  @apply w-fit px-2 text-xs;
}
.room-follow-up h3 {
  @apply text-sm font-semibold;
}
.follow-up-groups {
  @apply mt-2 grid flex-1 grid-cols-2 gap-2;
}
.follow-up-button {
  @apply grid h-full content-center gap-0.5 border border-outline-variant px-2 py-1;
}
.follow-up-button:disabled {
  @apply cursor-default hover:bg-transparent;
}
.follow-up-button:disabled :is(.follow-up-label, strong) {
  @apply text-on-surface-variant;
}
.follow-up-label {
  @apply text-sm font-medium text-on-surface;
}
.follow-up-count {
  @apply text-xs tabular-nums;
}
.follow-up-count strong {
  @apply ml-0 text-sm;
}
.record-link {
  @apply font-medium text-on-surface underline decoration-outline-variant underline-offset-2 hover:decoration-current [overflow-wrap:anywhere];
}
.property-dashboard :is(a, button, [tabindex]):focus-visible {
  @apply outline outline-2 outline-offset-2 outline-primary;
}
.task-count {
  @apply text-sm font-normal tabular-nums text-on-surface-variant;
}
.agenda-card {
  --agenda-list-max: 5rem;
}
.agenda-list {
  @apply divide-y divide-outline-variant overflow-y-auto px-1 text-sm;
  max-block-size: var(--agenda-list-max);
  scroll-padding-block: 0.25rem;
}
.agenda-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0 0.5rem;
  padding-block: 0.35rem;
  overflow-wrap: anywhere;
}
.agenda-date {
  @apply text-xs text-on-surface-variant;
}
.schedule-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem 1.25rem;
}
.schedule-grid > div {
  min-width: 0;
}
.schedule-grid h3 {
  @apply flex flex-wrap items-baseline gap-x-2 text-xs font-semibold;
}
.schedule-window {
  @apply font-normal text-on-surface-variant;
}
@container (min-width: 20rem) {
  .schedule-grid:has(> div + div) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container (min-width: 40rem) {
  .dashboard-grid:has(> section + section) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .occupancy-section {
    grid-column: 1 / -1;
  }
  .occupancy-content {
    grid-template-columns: minmax(0, 25rem) minmax(9rem, 1fr);
  }
  .room-map {
    max-inline-size: 25rem;
  }
  .room-key {
    max-inline-size: 11rem;
  }
  .room-legend {
    @apply grid gap-0.5;
  }
  .agenda-card {
    --agenda-list-max: 10rem;
  }
  .agenda-list li {
    padding-block: 0.625rem;
  }
  .schedule-grid {
    column-gap: 1.75rem;
  }
}
@container (min-width: 54rem) {
  .occupancy-content {
    grid-template-columns: minmax(0, 25rem) minmax(9rem, 11rem) minmax(0, 1fr);
  }
  .room-follow-up {
    display: flex;
    flex-direction: column;
    align-self: stretch;
    min-width: 0;
    padding-inline-start: 1rem;
    border-inline-start: 1px solid rgb(var(--md-sys-color-outline-variant));
  }
  .clear-follow-up {
    display: none;
  }
  .occupancy-counts {
    @apply gap-x-6;
  }
  .occupancy-counts > div {
    @apply flex-col-reverse items-start gap-0.5;
  }
  .occupancy-counts dd {
    @apply text-xl leading-tight;
  }
}
@container (min-width: 62rem) {
  .follow-up-groups {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@container (min-width: 62rem) and (max-width: 72rem) {
  .occupancy-content {
    column-gap: 1rem;
    grid-template-columns: minmax(0, 25rem) minmax(9rem, 9.5rem) minmax(0, 1fr);
  }
  .follow-up-label {
    @apply text-xs;
  }
}
@media (max-width: 639px) and (max-height: 740px) {
  .dashboard-operations {
    gap: 0.5rem;
  }
  .dashboard-heading h1 {
    @apply text-xl;
  }
  .dashboard-grid {
    gap: 0.5rem;
  }
  .overview-card {
    gap: 0.375rem;
    padding: 0.625rem;
  }
  .room-tile {
    @apply min-h-7;
  }
  .legend-button {
    @apply gap-1 px-0.5;
  }
  .agenda-card {
    --agenda-list-max: 4rem;
  }
  .agenda-list li {
    padding-block: 0.25rem;
  }
  .schedule-grid .agenda-list li {
    flex-direction: column;
  }
}
</style>
