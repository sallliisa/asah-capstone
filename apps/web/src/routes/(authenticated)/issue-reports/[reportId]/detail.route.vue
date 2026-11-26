<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Detail, DetailView } from '@southneuhof/loom'
import { issueReports } from '../issue-reports.resource'

const route = useRoute('issue-reports-detail')
const reportId = computed(() => route.params.reportId)
</script>

<template>
  <DetailView v-bind="issueReports.detail({ id: reportId })">
    <template #body="{ record, detail }">
      <Detail v-bind="detail" :fields="{ ...detail.fields, ...(record.activityId && { activityName: {} }) }">
        <template #value:activityName>
          <RouterLink v-if="record.activityId" :to="{ name: 'activities-detail', params: { activityId: record.activityId } }" class="text-primary underline">
            {{ record.activityName }}
          </RouterLink>
        </template>
      </Detail>
    </template>
  </DetailView>
</template>
