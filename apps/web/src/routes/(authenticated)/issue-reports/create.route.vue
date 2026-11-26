<script setup lang="ts">
import { FormView } from '@southneuhof/loom'
import { issueReports } from './issue-reports.resource'
</script>

<template>
  <FormView v-bind="issueReports.create()" title="Report an Issue" />
</template>
