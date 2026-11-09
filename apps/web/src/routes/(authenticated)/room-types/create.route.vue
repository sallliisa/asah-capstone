<script setup lang="ts">
import { FormView } from '@southneuhof/loom'
import { roomTypes } from './room-types.resource'
</script>

<template>
  <FormView v-bind="roomTypes.create()" title="Create Room Type" />
</template>
