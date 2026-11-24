<script setup lang="ts">
import Card from '@southneuhof/loom/components/base/Card.vue'
import Disclosure from '@southneuhof/loom/components/base/Disclosure.vue'
import report from '../../../../../../analysis/report.json'
import reportUrl from '../../../../../../analysis/report.json?url'

const count = (value: number) => value.toLocaleString('en')
const money = (value: number) => `Rp ${value.toLocaleString('id-ID')}`
const recentMonths = Object.entries(report.cash)
  .sort(([left], [right]) => left.localeCompare(right))
  .slice(-2)
</script>

<template>
  <Card class="shrink-0 gap-2 p-3">
    <h2 class="text-base font-semibold">Sample operations analysis</h2>
    <p class="text-sm text-on-surface-variant">Synthetic data · {{ report.periodStart }} to {{ report.periodEnd }}</p>
    <Disclosure title="View sample findings">
      <div class="flex flex-col gap-3 pt-3 text-sm">
        <p>{{ count(report.pending) }} activities needed follow-up and {{ count(report.overdueRentOccurrences) }} rent payments were overdue as of {{ report.periodEnd }}.</p>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <caption class="sr-only">
              Settled cash in the sample
            </caption>
            <thead>
              <tr class="border-b border-outline-variant">
                <th class="p-2" scope="col">Month</th>
                <th class="p-2 text-right" scope="col">Income</th>
                <th class="p-2 text-right" scope="col">Expenses</th>
                <th class="p-2 text-right" scope="col">Net cash</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr v-for="[month, total] in recentMonths" :key="month">
                <th class="p-2 font-normal" scope="row">{{ month }}</th>
                <td class="whitespace-nowrap p-2 text-right tabular-nums">{{ money(total.income) }}</td>
                <td class="whitespace-nowrap p-2 text-right tabular-nums">{{ money(total.expenses) }}</td>
                <td class="whitespace-nowrap p-2 text-right tabular-nums">{{ money(total.net) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>The sample includes {{ count(report.priorities.length) }} tenant review priorities from model {{ report.modelVersion }}.</p>
        <ul class="list-disc space-y-1 pl-5">
          <li v-for="recommendation in report.recommendations" :key="recommendation">{{ recommendation }}</li>
        </ul>
        <a :href="reportUrl" download="operations-analysis.json" class="self-start text-primary underline">Download report and source activity IDs</a>
      </div>
    </Disclosure>
  </Card>
</template>
