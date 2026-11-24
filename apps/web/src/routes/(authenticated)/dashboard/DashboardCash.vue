<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { ChartConfiguration } from 'chart.js'
import type { z } from 'zod/v4'
import type { activityDashboardQuerySchema } from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import { useCollection } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import DateInput from '@southneuhof/loom/components/inputs/DateInput.vue'
import SelectInput from '@southneuhof/loom/components/inputs/SelectInput.vue'
import Tabs from '@southneuhof/loom/components/composites/Tabs.vue'
import { activitiesActions } from '../activities/activities.actions'
import { activityToday } from '../activities/activities.schema'
import DashboardChart from './DashboardChart.vue'
import { loadDashboardCash } from './dashboard.actions'

type CashQuery = z.output<typeof activityDashboardQuerySchema>
type Snapshot = Awaited<ReturnType<typeof loadDashboardCash>>['data'][number]
const today = ref(activityToday())
const monthStart = computed(() => `${today.value.slice(0, 7)}-01`)
const startDate = ref(monthStart.value)
const endDate = ref(today.value)
const roomId = ref<string | null>(null)
const startInputError = ref<string>()
const endInputError = ref<string>()

function calendarModel(date: Ref<string>) {
  return computed<string | null | undefined>({
    get: () => (date.value ? `${date.value}T00:00:00` : null),
    set: (value: string | null | undefined) => {
      date.value = value ?? ''
    },
  })
}

const startInput = calendarModel(startDate)
const endInput = calendarModel(endDate)
const dateError = computed(() => {
  if (startInputError.value || endInputError.value) return startInputError.value || endInputError.value
  if (!startDate.value || !endDate.value) return 'Enter both dates.'
  if (endDate.value > today.value) return 'End date must be today or earlier.'
  if (startDate.value > endDate.value) return 'End date must be on or after the start date.'
  return ''
})
const query = computed<CashQuery>(() => ({
  ...(startDate.value === monthStart.value && endDate.value === today.value ? { period: 'this-month' } : { period: 'custom', from: startDate.value, to: endDate.value }),
  ...(roomId.value ? { roomId: roomId.value } : {}),
}))

const { records, loading, error, refresh } = useCollection(() => ({
  ...(dateError.value ? { data: [] } : { load: loadDashboardCash }),
  resource: 'activities',
  namespace: 'operational-dashboard',
  query: query.value,
}))
const snapshot = computed(() => records.value[0])
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const compactMoney = new Intl.NumberFormat('id-ID', { notation: 'compact' })
const compact = (value: string | number) => (typeof value === 'number' ? compactMoney.format(value) : value)
const palette = ['#397c72', '#cf7352', '#7976ab', '#b18c3b', '#5688ad', '#af6485', '#7e9850', '#9b7962']
const metrics = [
  { field: 'income', label: 'Income', kind: 'income' },
  { field: 'expenses', label: 'Expenses', kind: 'expense' },
  { field: 'net', label: 'Net cash', kind: undefined },
] as const

function settledRecords(snapshot: Snapshot, kind?: 'income' | 'expense') {
  return {
    name: 'income-expenses' as const,
    query: {
      'activities.paymentFrom': snapshot.periodStart,
      'activities.paymentTo': snapshot.periodEnd,
      'activities.roomId': snapshot.roomId ?? undefined,
      'activities.paymentStatus': 'settled',
      'activities.financialKind': kind,
    },
  }
}

const charts = computed(() => {
  const data = snapshot.value
  if (!data) return []
  const dates = data.daily.map((day) => day.date)
  const options = { scales: { x: { ticks: { maxTicksLimit: 8, maxRotation: 0, callback: (value: string | number) => dates[Number(value)]?.slice(5) } }, y: { ticks: { callback: compact } } } }
  const hasPayments = data.daily.some((day) => day.income || day.expenses)
  const biggestCategory = data.expensesByCategory[0]
  const biggestRoom = data.expensesByRoom[0]

  return [
    {
      label: 'Daily cash',
      title: 'Daily settled income and expenses',
      summary: hasPayments ? '' : 'No settled payments in this period.',
      empty: !hasPayments,
      configuration: {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [
            { label: 'Income', data: data.daily.map((day) => day.income), backgroundColor: palette[0] },
            { label: 'Expenses', data: data.daily.map((day) => day.expenses), backgroundColor: palette[1] },
          ],
        },
        options,
      },
    },
    {
      label: 'Cumulative net',
      title: 'Cumulative net cash',
      summary: hasPayments ? '' : 'No settled payments in this period.',
      empty: !hasPayments,
      configuration: {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{ label: 'Net cash', data: data.daily.map((day) => day.cumulativeNet), borderColor: palette[0], pointRadius: dates.length === 1 ? 3 : 0, stepped: true }],
        },
        options,
      },
    },
    {
      label: 'Expenses by category',
      title: 'Settled expenses by category',
      summary: biggestCategory ? `${biggestCategory.name} had the most expenses at ${money.format(biggestCategory.amount)}.` : 'No settled expenses in this period.',
      empty: !biggestCategory,
      configuration: {
        type: 'doughnut',
        data: {
          labels: data.expensesByCategory.map((group) => group.name),
          datasets: [{ label: 'Expenses', data: data.expensesByCategory.map((group) => group.amount), backgroundColor: palette }],
        },
      },
    },
    {
      label: 'Expenses by room',
      title: 'Settled expenses by room',
      summary: biggestRoom ? `${biggestRoom.name} had the most expenses at ${money.format(biggestRoom.amount)}.` : 'No settled expenses in this period.',
      empty: !biggestRoom,
      configuration: {
        type: 'bar',
        data: {
          labels: data.expensesByRoom.map((group) => group.name),
          datasets: [{ label: 'Expenses', data: data.expensesByRoom.map((group) => group.amount), backgroundColor: palette[1] }],
        },
        options: { indexAxis: 'y', scales: { x: { ticks: { callback: compact } }, y: {} } },
      },
    },
  ] satisfies { label: string; title: string; summary: string; empty: boolean; configuration: ChartConfiguration<'bar' | 'line' | 'doughnut'> }[]
})
const selectedChart = ref('Daily cash')
const chartOptions = computed(() => charts.value.map(({ label }) => ({ label, value: label })))
const chart = computed(() => charts.value.find(({ label }) => label === selectedChart.value))

let interval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  interval = setInterval(() => {
    const wasCurrentMonth = query.value.period === 'this-month'
    today.value = activityToday()
    if (wasCurrentMonth) {
      startDate.value = monthStart.value
      endDate.value = today.value
    }
    if (!dateError.value && (!wasCurrentMonth || roomId.value)) void refresh().catch(() => {})
  }, 60000)
})
onBeforeUnmount(() => clearInterval(interval))
</script>

<template>
  <section aria-labelledby="cash-heading" class="min-w-0">
    <Card variant="outlined" color="surfaceContainerLowest" class="gap-3 p-3 sm:p-4">
      <h2 id="cash-heading" class="text-base font-semibold sm:text-lg">Settled cash</h2>
      <div class="cash-filters">
        <DateInput v-model="startInput" label="Start date" locale="en-GB" :error="startInputError" @validation:error="startInputError = $event" />
        <DateInput v-model="endInput" label="End date" locale="en-GB" :error="endInputError || (startInputError ? undefined : dateError)" @validation:error="endInputError = $event" />
        <SelectInput
          label="Room"
          :load="activitiesActions.rooms"
          pick="id"
          view="name"
          placeholder="All rooms"
          :model-value="roomId"
          @update:model-value="roomId = typeof $event === 'string' ? $event : null"
        />
      </div>
      <p v-if="error" role="alert" class="text-sm text-on-surface-variant">
        {{ snapshot ? 'Could not refresh settled cash.' : 'Could not load settled cash.' }}
        <Button type="button" variant="text" @click="refresh">Retry</Button>
      </p>
      <p v-else-if="loading && !snapshot" role="status" class="text-sm text-on-surface-variant">Loading settled cash…</p>
      <template v-if="snapshot">
        <dl class="grid grid-cols-3 gap-2 border-y border-outline-variant py-2">
          <div v-for="metric in metrics" :key="metric.field" class="min-w-0">
            <dt class="text-xs font-medium text-on-surface-variant">{{ metric.label }}</dt>
            <dd class="mt-0.5 text-sm font-semibold tabular-nums sm:text-lg">
              <RouterLink
                :to="settledRecords(snapshot, metric.kind)"
                :aria-label="`${metric.label}, ${money.format(snapshot[metric.field])}. View settled records`"
                class="rounded underline decoration-outline-variant underline-offset-2 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [overflow-wrap:anywhere]"
              >
                {{ money.format(snapshot[metric.field]) }}
              </RouterLink>
            </dd>
          </div>
        </dl>
        <Tabs v-model="selectedChart" label="Cash chart" variant="tonal" :items="chartOptions" />
        <template v-if="chart">
          <p v-if="chart.summary" aria-live="polite" class="text-sm text-on-surface-variant">{{ chart.summary }}</p>
          <div v-if="!chart.empty" class="flex h-56 min-w-0 sm:h-64">
            <DashboardChart :configuration="chart.configuration" :label="chart.title" />
          </div>
        </template>
      </template>
    </Card>
  </section>
</template>

<style scoped>
.cash-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
}
@container (min-width: 34rem) {
  .cash-filters {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr);
  }
}
</style>
