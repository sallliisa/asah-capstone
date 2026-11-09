<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/loom'
import { rooms } from '../rooms.resource'

const route = useRoute('rooms-detail')
const roomId = computed(() => route.params.roomId)
</script>

<template>
  <DetailView v-bind="rooms.detail({ id: roomId })" />
</template>
