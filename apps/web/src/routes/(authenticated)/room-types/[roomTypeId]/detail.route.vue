<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/loom'
import { roomTypes } from '../room-types.resource'

const route = useRoute('room-types-detail')
const roomTypeId = computed(() => route.params.roomTypeId)
</script>

<template>
  <DetailView v-bind="roomTypes.detail({ id: roomTypeId })" />
</template>
