<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/loom'
import { issueReports } from '../issue-reports.resource'

const route = useRoute('issue-reports-edit')
const reportId = computed(() => route.params.reportId)
</script>

<template>
  <FormView v-bind="issueReports.update({ id: reportId })" title="Update Issue Report" />
</template>
