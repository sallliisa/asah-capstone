<script setup lang="ts">
import { FormView } from '@southneuhof/loom'
import { rooms } from './rooms.resource'
</script>

<template>
  <FormView v-bind="rooms.create()" title="Create Room" />
</template>
