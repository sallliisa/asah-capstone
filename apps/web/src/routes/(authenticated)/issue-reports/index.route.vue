<script setup lang="ts">
import { ListView } from '@southneuhof/loom'
import { identity } from '@/framework/identity'
import { issueReports } from './issue-reports.resource'

const page = issueReports.list()
</script>

<template>
  <ListView v-bind="page" title="Issue Reports" :create-route="identity?.roleCodes.includes('occupant') ? page.createRoute : false" :action-labels="{ create: 'Report an issue' }" />
</template>
