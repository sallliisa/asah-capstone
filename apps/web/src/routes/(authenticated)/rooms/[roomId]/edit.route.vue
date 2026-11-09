<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { rooms } from '../rooms.resource'

const route = useRoute('rooms-edit')
const roomId = computed(() => route.params.roomId)
</script>

<template>
  <FormView v-bind="rooms.update({ id: roomId })" title="Edit Room" />
</template>
