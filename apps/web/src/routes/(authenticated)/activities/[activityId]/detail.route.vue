<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Detail, DetailView } from '@southneuhof/loom'
import Button from '@southneuhof/loom/components/base/Button.vue'
import Card from '@southneuhof/loom/components/base/Card.vue'
import Icon from '@southneuhof/loom/components/base/Icon.vue'
import { permissions } from '@/stores/permissions'
import AttributionHistory from '../AttributionHistory.vue'
import { activities } from '../activities.resource'

const access = permissions()
const route = useRoute('activities-detail')
const page = computed(() => activities.detail({ id: route.params.activityId }))
</script>

<template>
  <DetailView v-bind="page" title="Activity Details">
    <template #controls="{ record }">
      <RouterLink v-if="record && access.can(activities.permissions.update)" :to="{ name: 'activities-edit', params: { activityId: record.id } }" custom v-slot="{ href, navigate }">
        <Button variant="filled" :href="href" @click="navigate">
          <template #icon><Icon name="edit" /></template>
          Edit activity
        </Button>
      </RouterLink>
    </template>

    <template #body="{ record, detail }">
      <div class="grid gap-2" :class="{ 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]': record.financialKind !== 'none' || record.dueDate }">
        <Card variant="outlined" color="surfaceContainer" class="min-w-0 p-0 lg:col-start-1 lg:row-start-1">
          <section class="flex flex-col gap-4 p-4 sm:p-5">
            <div>
              <h2 class="text-xl font-semibold [overflow-wrap:anywhere]">{{ record.name }}</h2>
              <p v-if="record.description" class="mt-2 whitespace-pre-wrap text-sm text-on-surface-variant [overflow-wrap:anywhere]">
                {{ record.description }}
              </p>
            </div>
            <Detail
              v-bind="detail"
              :fields="{
                workStatus: detail.fields?.workStatus ?? {},
                ...(record.completedDate && { completedDate: detail.fields?.completedDate ?? {} }),
                categoryName: {},
                roomName: {},
                tenantName: {},
              }"
            >
              <template #value:roomName>{{ record.roomName ?? 'Unassigned' }}</template>
              <template #value:tenantName>{{ record.tenantName ?? 'Unassigned' }}</template>
            </Detail>
          </section>
        </Card>

        <Card v-if="record.financialKind !== 'none'" variant="outlined" color="surfaceContainer" class="min-w-0 p-0 lg:col-start-2 lg:row-start-1">
          <section class="flex flex-col gap-2 p-4 sm:p-5">
            <h2 class="text-lg font-semibold">Payment</h2>
            <Detail
              v-bind="detail"
              :fields="{
                amount: { emphasis: 'strong' },
                financialKind: detail.fields?.financialKind ?? {},
                paymentStatus: detail.fields?.paymentStatus ?? {},
                ...(record.paymentDate && { paymentDate: detail.fields?.paymentDate ?? {} }),
                receipt: detail.fields?.receipt ?? {},
              }"
            >
              <template #value:amount>
                <span v-if="record.amount !== null" class="tabular-nums">Rp {{ record.amount.toLocaleString('id-ID') }}</span>
                <span v-else>—</span>
              </template>
              <template v-if="!record.receipt" #value:receipt>None attached</template>
            </Detail>
          </section>
        </Card>

        <Card v-if="record.dueDate" variant="outlined" color="surfaceContainer" class="min-w-0 p-0 lg:col-start-2" :class="record.financialKind === 'none' ? 'lg:row-start-1' : 'lg:row-start-2'">
          <section class="flex flex-col gap-2 p-4 sm:p-5">
            <h2 class="text-lg font-semibold">Schedule</h2>
            <Detail v-bind="detail" :fields="{ dueDate: detail.fields?.dueDate ?? {}, taskTarget: detail.fields?.taskTarget ?? {}, ...(record.recurringPlanId && { planName: {} }) }" />
          </section>
        </Card>

        <AttributionHistory v-if="access.can(activities.permissions.detail) && access.can('view-users')" :key="record.id" :activity-id="record.id" class="lg:col-start-1 lg:row-start-2" />
      </div>
    </template>
  </DetailView>
</template>
