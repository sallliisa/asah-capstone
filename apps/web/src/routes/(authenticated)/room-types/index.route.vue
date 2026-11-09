<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import { roomTypes } from './room-types.resource'
</script>

<template>
  <ListView v-bind="roomTypes.list()" title="Room Types" />
</template>
