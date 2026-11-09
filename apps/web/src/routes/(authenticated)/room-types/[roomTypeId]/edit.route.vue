<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { roomTypes } from '../room-types.resource'

const route = useRoute('room-types-edit')
const roomTypeId = computed(() => route.params.roomTypeId)
</script>

<template>
  <FormView v-bind="roomTypes.update({ id: roomTypeId })" title="Edit Room Type" />
</template>
