<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { users } from '../users.resource'

const route = useRoute('settings-users-edit')
const userId = computed(() => route.params.userId)
</script>

<template>
  <FormView v-bind="users.update({ id: userId })" title="Edit User">
    <template #footer="{ draft }">
      <p v-if="draft?.statusCode === 'non_active'" class="text-sm text-on-surface-variant">Setting an active user to inactive ends their current sessions.</p>
    </template>
  </FormView>
</template>
