<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import { rooms } from './rooms.resource'
</script>

<template>
  <ListView v-bind="rooms.list()" title="Rooms" />
</template>
