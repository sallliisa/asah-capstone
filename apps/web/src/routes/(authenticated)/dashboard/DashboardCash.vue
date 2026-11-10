<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { ChartConfiguration } from 'chart.js'
import type { z } from 'zod/v4'
import type { activityDashboardSchema } from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import Card from '@southneuhof/loom/components/base/Card.vue'
import DashboardChart from './DashboardChart.vue'

const props = defineProps<{ snapshot: z.output<typeof activityDashboardSchema> }>()
const money = (value: number) => `Rp ${value.toLocaleString('id-ID')}`
const palette = ['#397c72', '#cf7352', '#7976ab', '#b18c3b', '#5688ad', '#af6485', '#7e9850', '#9b7962']
const compact = (value: string | number) => (typeof value === 'number' ? new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value) : value)
const topRooms = computed(() => props.snapshot.expensesByRoom.filter((room) => room.id !== null).slice(0, 3))
const charts = computed(() => {
  const snapshot = props.snapshot
  const options = { scales: { x: {}, y: { ticks: { callback: compact } } } }
  return [
    {
      title: 'Daily income and expenses',
      empty: snapshot.income === 0 && snapshot.expenses === 0,
      configuration: {
        type: 'bar',
        data: {
          labels: snapshot.daily.map((day) => day.date.slice(8)),
          datasets: [
            { label: 'Income', data: snapshot.daily.map((day) => day.income), backgroundColor: palette[0] },
            { label: 'Expenses', data: snapshot.daily.map((day) => day.expenses), backgroundColor: palette[1] },
          ],
        },
        options,
      },
    },
    {
      title: 'Cumulative net cash',
      empty: snapshot.income === 0 && snapshot.expenses === 0,
      configuration: {
        type: 'line',
        data: {
          labels: snapshot.daily.map((day) => day.date.slice(8)),
          datasets: [{ label: 'Net cash', data: snapshot.daily.map((day) => day.cumulativeNet), borderColor: palette[0], pointRadius: 2, tension: 0.15 }],
        },
        options,
      },
    },
    {
      title: 'Expenses by category',
      empty: snapshot.expensesByCategory.length === 0,
      configuration: {
        type: 'doughnut',
        data: {
          labels: snapshot.expensesByCategory.map((group) => group.name),
          datasets: [{ label: 'Expenses', data: snapshot.expensesByCategory.map((group) => group.amount), backgroundColor: palette }],
        },
      },
    },
    {
      title: 'Expenses by room',
      empty: snapshot.expensesByRoom.length === 0,
      configuration: {
        type: 'bar',
        data: {
          labels: snapshot.expensesByRoom.map((group) => group.name),
          datasets: [{ label: 'Expenses', data: snapshot.expensesByRoom.map((group) => group.amount), backgroundColor: palette[1] }],
        },
        options: { indexAxis: 'y', scales: { x: { ticks: { callback: compact } }, y: {} } },
      },
    },
  ] satisfies { title: string; empty: boolean; configuration: ChartConfiguration<'bar' | 'line' | 'doughnut'> }[]
})
function financeLink(kind?: 'income' | 'expense'): RouteLocationRaw {
  return {
    name: 'income-expenses',
    query: {
      'activities.paymentFrom': props.snapshot.monthStart,
      'activities.paymentTo': props.snapshot.today,
      'activities.paymentStatus': 'settled',
      ...(kind ? { 'activities.financialKind': kind } : {}),
    },
  }
}
</script>

<template>
  <div class="grid min-h-0 min-w-0 flex-1 grid-cols-6 grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-3">
    <Card class="col-span-6 min-w-0 gap-3 p-3">
      <h2 class="text-base font-semibold">This month's cash</h2>
      <p class="text-sm text-on-surface-variant">{{ snapshot.monthStart }} to {{ snapshot.today }}. Settled payments only.</p>
      <div class="grid grid-cols-3 gap-3">
        <Card
          v-for="metric in [
            { title: 'Income', value: snapshot.income, kind: 'income' as const },
            { title: 'Expenses', value: snapshot.expenses, kind: 'expense' as const },
            { title: 'Net cash movement', value: snapshot.net, kind: undefined },
          ]"
          :key="metric.title"
          color="surfaceContainerHigh"
          class="min-w-0 gap-1 p-3"
        >
          <h3 class="text-sm text-on-surface-variant">{{ metric.title }}</h3>
          <RouterLink :to="financeLink(metric.kind)" class="break-words font-semibold text-primary underline tabular-nums">{{ money(metric.value) }}</RouterLink>
        </Card>
      </div>
    </Card>
    <Card v-for="chart in charts" :key="chart.title" class="col-span-3 min-h-0 min-w-0 gap-2 p-3" style="height: clamp(10rem, 24dvh, 15rem)">
      <h3 class="text-sm font-semibold">{{ chart.title }}</h3>
      <p v-if="chart.empty" class="flex min-h-0 flex-1 items-center justify-center text-sm text-on-surface-variant">
        No settled {{ chart.title.startsWith('Expenses') ? 'expenses' : 'payments' }} this month.
      </p>
      <DashboardChart v-else :configuration="chart.configuration" :label="chart.title" />
    </Card>
    <Card class="col-span-6 min-h-0 min-w-0 gap-2 overflow-auto p-3">
      <h3 class="text-sm font-semibold">Room costs this month</h3>
      <p v-if="!topRooms.length" class="text-sm text-on-surface-variant">No settled room expenses this month.</p>
      <ol v-else class="divide-y divide-outline-variant">
        <li v-for="(room, index) in topRooms" :key="room.id ?? 'shared'" class="py-2 first:pt-0">
          <div class="flex items-baseline justify-between gap-2 text-sm font-semibold">
            <span>{{ index + 1 }}. Room {{ room.name }}</span>
            <span class="tabular-nums">{{ money(room.amount) }}</span>
          </div>
          <ul class="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs">
            <li v-for="activity in room.activities" :key="activity.id">
              <RouterLink :to="{ name: 'activities-detail', params: { activityId: activity.id } }" class="text-primary underline">{{ activity.name }} · {{ money(activity.amount) }}</RouterLink>
            </li>
          </ul>
        </li>
      </ol>
    </Card>
  </div>
</template>
