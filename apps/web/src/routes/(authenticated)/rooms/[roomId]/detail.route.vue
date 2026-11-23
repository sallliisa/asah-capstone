<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Detail, DetailView } from '@southneuhof/loom'
import Card from '@southneuhof/loom/components/base/Card.vue'
import { rooms } from '../rooms.resource'

const route = useRoute('rooms-detail')
const roomId = computed(() => route.params.roomId)
</script>

<template>
  <DetailView v-bind="rooms.detail({ id: roomId })" title="Room Details">
    <template #body="{ record, detail }">
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
        <div class="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <section>
            <p class="text-sm font-medium text-on-surface-variant">{{ record.roomCode }}</p>
            <h2 class="mt-1 break-words text-xl font-semibold text-on-surface">{{ record.name }}</h2>
            <p v-if="record.description" class="mt-3 whitespace-pre-wrap break-words text-sm text-on-surface-variant">
              {{ record.description }}
            </p>
          </section>
          <section>
            <h2 class="mb-2 text-base font-semibold text-on-surface">Room information</h2>
            <Detail v-bind="detail" :fields="{ roomTypeName: {}, occupantName: {}, createdAt: detail.fields?.createdAt ?? {} }">
              <template #value:occupantName>
                {{ record.occupantName ?? 'Unoccupied' }}
              </template>
            </Detail>
          </section>
        </div>
      </Card>
    </template>
  </DetailView>
</template>
