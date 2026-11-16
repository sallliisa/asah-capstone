<script setup lang="ts">
import { provide, ref } from 'vue'
import { frameworkUiDefaultsKey } from '@southneuhof/loom/components/views/uiDefaults'
import { z } from 'zod/v4'
import { defineForm } from '@southneuhof/loom'
import FormView from '@southneuhof/loom/components/views/FormView.vue'
import LocationInputPreview from '@/prototypes/location-input/LocationInputPreview.vue'
import { locationOperations } from '@/framework/adapters/location'

provide(frameworkUiDefaultsKey, { backLabel: 'Back', submitLabel: 'Submit' })

const schema = z.object({
  name: z.string().min(1),
  location: z.object({ lat: z.number(), lng: z.number() }),
  notes: z.string().optional(),
})
const submitted = ref(false)
const definition = defineForm({
  schema,
  fields: {
    name: { renderer: 'text', label: 'Place name' },
    location: {
      renderer: LocationInputPreview,
      label: 'Location',
      props: { mapProvider: 'openstreetmap', operations: locationOperations },
    },
    notes: { renderer: 'textarea', label: 'Notes', props: { placeholder: 'For example: entrance on the north side' } },
  },
  submit: (values) => values,
})
const form = { ...definition, initialData: { name: 'Jakarta office', location: { lat: -6.1754, lng: 106.8272 } } }
</script>

<template>
  <main class="location-showcase min-h-screen bg-surface px-4 py-8 text-on-surface sm:px-8 sm:py-12">
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <p class="text-sm text-muted">Temporary preview · LocationInput</p>
      <FormView :form="form" title="Add place" :back-to="false" :default-to="false" @submitted="submitted = true" />
      <p v-if="submitted" role="status" class="text-sm text-primary">Form is valid. This preview does not save data.</p>
      <p class="text-xs text-muted">Live map and search. Submit is for preview only. This page will be removed when the design is complete.</p>
    </div>
  </main>
</template>

<style scoped>
.location-showcase :deep(:focus),
.location-showcase :deep(:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}
.location-showcase :deep(.outline:focus-within) {
  outline: none !important;
  box-shadow: none !important;
}
</style>
