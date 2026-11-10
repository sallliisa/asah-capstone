<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { ChartConfiguration } from 'chart.js'
import type { z } from 'zod/v4'
import type { activityDashboardSchema } from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import Disclosure from '@southneuhof/loom/components/base/Disclosure.vue'
import DashboardChart from './DashboardChart.vue'

const props = defineProps<{ snapshot: z.output<typeof activityDashboardSchema> }>()
const money = (value: number) => `Rp ${value.toLocaleString('id-ID')}`
const palette = ['#397c72', '#cf7352', '#7976ab', '#b18c3b', '#5688ad', '#af6485', '#7e9850', '#9b7962']
const compact = (value: string | number) => (typeof value === 'number' ? new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value) : value)
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
  <p class="text-sm text-on-surface-variant">{{ snapshot.monthStart }} to {{ snapshot.today }}. Settled payments only.</p>
  <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div>
      <dt class="text-sm text-on-surface-variant">Income</dt>
      <dd class="break-words font-semibold tabular-nums">
        <RouterLink :to="financeLink('income')" class="text-primary underline">{{ money(snapshot.income) }}</RouterLink>
      </dd>
    </div>
    <div>
      <dt class="text-sm text-on-surface-variant">Expenses</dt>
      <dd class="break-words font-semibold tabular-nums">
        <RouterLink :to="financeLink('expense')" class="text-primary underline">{{ money(snapshot.expenses) }}</RouterLink>
      </dd>
    </div>
    <div>
      <dt class="text-sm text-on-surface-variant">Net cash movement</dt>
      <dd class="break-words font-semibold tabular-nums">
        <RouterLink :to="financeLink()" class="text-primary underline">{{ money(snapshot.net) }}</RouterLink>
      </dd>
    </div>
  </dl>
  <div class="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
    <section v-for="chart in charts" :key="chart.title" class="flex min-h-0 min-w-0 flex-col gap-2">
      <h3 class="text-sm font-semibold">{{ chart.title }}</h3>
      <p v-if="chart.empty" class="flex min-h-0 flex-1 items-center justify-center text-sm text-on-surface-variant">
        No settled {{ chart.title.startsWith('Expenses') ? 'expenses' : 'payments' }} this month.
      </p>
      <DashboardChart v-else :configuration="chart.configuration" :label="chart.title" />
    </section>
  </div>
  <Disclosure title="Chart data">
    <div class="overflow-x-auto py-3 text-sm">
      <table class="w-full text-left tabular-nums">
        <caption class="pb-2 text-left font-semibold">
          Daily cash movement
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Income</th>
            <th scope="col">Expenses</th>
            <th scope="col">Cumulative net</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="day in snapshot.daily" :key="day.date">
            <th scope="row" class="py-1 font-normal">{{ day.date }}</th>
            <td>{{ money(day.income) }}</td>
            <td>{{ money(day.expenses) }}</td>
            <td>{{ money(day.cumulativeNet) }}</td>
          </tr>
        </tbody>
      </table>
      <table
        v-for="group in [
          { title: 'Expenses by category', values: snapshot.expensesByCategory },
          { title: 'Expenses by room', values: snapshot.expensesByRoom },
        ]"
        :key="group.title"
        class="mt-4 w-full text-left tabular-nums"
      >
        <caption class="pb-2 text-left font-semibold">
          {{
            group.title
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Expenses</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in group.values" :key="row.name">
            <th scope="row" class="py-1 font-normal">{{ row.name }}</th>
            <td>{{ money(row.amount) }}</td>
          </tr>
          <tr v-if="!group.values.length">
            <td colspan="2">No settled expenses this month.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </Disclosure>
</template>
