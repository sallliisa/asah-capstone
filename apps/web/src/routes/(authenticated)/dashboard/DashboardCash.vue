<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { ChartConfiguration } from 'chart.js'
import type { z } from 'zod/v4'
import type { activityDashboardSchema } from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import Card from '@southneuhof/loom/components/base/Card.vue'
import Disclosure from '@southneuhof/loom/components/base/Disclosure.vue'
import DashboardChart from './DashboardChart.vue'

const props = defineProps<{ snapshot: z.output<typeof activityDashboardSchema> }>()
const money = (value: number) => `Rp ${value.toLocaleString('id-ID')}`
const palette = ['#397c72', '#cf7352', '#7976ab', '#b18c3b', '#5688ad', '#af6485', '#7e9850', '#9b7962']
const compact = (value: string | number) => (typeof value === 'number' ? new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value) : value)
const topRooms = computed(() => props.snapshot.expensesByRoom.filter((room) => room.id !== null).slice(0, 3))
const charts = computed(() => {
  const snapshot = props.snapshot
  const dates = snapshot.daily.map((day) => day.date)
  const options = { scales: { x: { ticks: { callback: (value: string | number) => dates[Number(value)]?.slice(5) } }, y: { ticks: { callback: compact } } } }
  const datesWithPayments = snapshot.daily.filter((day) => day.income || day.expenses).length
  const largestCategory = snapshot.expensesByCategory[0]
  const largestRoom = snapshot.expensesByRoom[0]
  return [
    {
      title: 'Daily income and expenses',
      rowHeading: 'Date',
      dataLabel: 'View daily cash data',
      summary: `Settled payments on ${datesWithPayments} of ${dates.length} days.`,
      empty: snapshot.income === 0 && snapshot.expenses === 0,
      configuration: {
        type: 'bar',
        data: {
          labels: dates,
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
      rowHeading: 'Date',
      dataLabel: 'View net cash data',
      summary: `The period ended with ${money(snapshot.net)} in net cash movement.`,
      empty: snapshot.income === 0 && snapshot.expenses === 0,
      configuration: {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{ label: 'Net cash', data: snapshot.daily.map((day) => day.cumulativeNet), borderColor: palette[0], pointRadius: 2, tension: 0.15 }],
        },
        options,
      },
    },
    {
      title: 'Expenses by category',
      rowHeading: 'Category',
      dataLabel: 'View category data',
      summary: largestCategory ? `${largestCategory.name} had the most expenses at ${money(largestCategory.amount)}.` : '',
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
      rowHeading: 'Room',
      dataLabel: 'View room data',
      summary: largestRoom ? `${largestRoom.name} had the most expenses at ${money(largestRoom.amount)}.` : '',
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
  ] satisfies {
    title: string
    rowHeading: string
    dataLabel: string
    summary: string
    empty: boolean
    configuration: ChartConfiguration<'bar' | 'line' | 'doughnut'>
  }[]
})
function financeLink(kind?: 'income' | 'expense'): RouteLocationRaw {
  return {
    name: 'income-expenses',
    query: {
      'activities.paymentFrom': props.snapshot.periodStart,
      'activities.paymentTo': props.snapshot.periodEnd,
      ...(props.snapshot.roomId ? { 'activities.roomId': props.snapshot.roomId } : {}),
      'activities.paymentStatus': 'settled',
      ...(kind ? { 'activities.financialKind': kind } : {}),
    },
  }
}
</script>

<template>
  <div class="grid min-w-0 shrink-0 grid-cols-6 gap-3">
    <Card class="col-span-6 min-w-0 gap-3 p-3">
      <h2 class="text-base font-semibold">Settled cash</h2>
      <p class="text-sm text-on-surface-variant">{{ snapshot.periodStart }} to {{ snapshot.periodEnd }}</p>
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
    <Card v-for="chart in charts" :key="chart.title" class="col-span-6 min-w-0 gap-2 p-3 sm:col-span-3">
      <h3 class="text-sm font-semibold">{{ chart.title }}</h3>
      <p v-if="chart.empty" class="flex min-h-40 items-center justify-center text-sm text-on-surface-variant">
        No settled {{ chart.title.startsWith('Expenses') ? 'expenses' : 'payments' }} in this period.
      </p>
      <template v-else>
        <p class="text-sm text-on-surface-variant">{{ chart.summary }}</p>
        <div class="flex min-w-0" style="height: clamp(10rem, 24dvh, 15rem)">
          <DashboardChart :configuration="chart.configuration" :label="chart.title" />
        </div>
        <Disclosure :title="chart.dataLabel">
          <div :aria-label="chart.title + ' data'" class="max-h-64 overflow-auto pt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" role="region" tabindex="0">
            <table class="w-full text-left text-sm">
              <caption class="sr-only">
                {{
                  chart.title
                }}
              </caption>
              <thead>
                <tr class="border-b border-outline-variant">
                  <th class="p-2" scope="col">{{ chart.rowHeading }}</th>
                  <th v-for="dataset in chart.configuration.data.datasets" :key="dataset.label" class="p-2 text-right" scope="col">{{ dataset.label }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant">
                <tr v-for="(label, index) in chart.configuration.data.labels" :key="index">
                  <th class="p-2 font-normal" scope="row">{{ label }}</th>
                  <td v-for="dataset in chart.configuration.data.datasets" :key="dataset.label" class="whitespace-nowrap p-2 text-right tabular-nums">
                    {{ money(dataset.data[index]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Disclosure>
      </template>
    </Card>
    <Card class="col-span-6 min-w-0 gap-2 p-3">
      <h3 class="text-sm font-semibold">Room costs</h3>
      <p v-if="!topRooms.length" class="text-sm text-on-surface-variant">No settled room expenses in this period.</p>
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
