import { defineDetail, defineForm, defineResource, defineTable } from '@southneuhof/loom'
import { issueReportCreateSchema, issueReportPublicSchema, issueReportStatusSchema, issueReportUpdateSchema } from '@southneuhof/api/src/routes/(authenticated)/issue-reports/schema.ts'
import { appDisplayPresets } from '@/configs/display-presets'
import { appInputPresets } from '@/configs/input-presets'
import { permissions } from '@/stores/permissions'
import { issueReportActions } from './issue-reports.actions'

const labels = {
  title: 'Issue',
  roomName: 'Room',
  roomId: 'Room',
  reporterName: 'Reported by',
  status: 'Status',
  activityName: 'Corrective repair',
  activityId: 'Corrective repair',
  createdAt: 'Reported at',
}

const statusOptions = {
  open: { label: 'Open', color: 'info' },
  in_progress: { label: 'In progress', color: 'warning' },
  resolved: { label: 'Resolved', color: 'success' },
} as const
const statusDisplay = { renderer: 'chip', props: { options: statusOptions } } as const
const statusChoices = issueReportStatusSchema.options.map((id) => ({ id, name: statusOptions[id].label }))

const table = defineTable({
  schema: issueReportPublicSchema,
  labels,
  columns: {
    title: {},
    roomName: {},
    reporterName: {},
    status: statusDisplay,
    createdAt: appDisplayPresets.createdAt,
  },
})

const detail = defineDetail({
  schema: issueReportPublicSchema,
  labels,
  fields: {
    title: {},
    roomName: {},
    reporterName: {},
    status: statusDisplay,
    description: {},
    createdAt: appDisplayPresets.createdAt,
  },
})

const createForm = defineForm({
  schema: issueReportCreateSchema,
  labels,
  fields: {
    roomId: { renderer: 'select', props: { load: issueReportActions.rooms, pick: 'id', view: 'name' } },
    title: appInputPresets.title,
    description: appInputPresets.description,
  },
})

const routeParams = (id: string) => ({ reportId: id })

export const issueReports = defineResource({
  key: 'issue-reports',
  identity: (record: { id: string }) => record.id,
  list: { permission: 'view-issue-reports', route: { name: 'issue-reports' }, table: { ...table, load: issueReportActions.list } },
  create: {
    permission: 'create-issue-reports',
    route: { name: 'issue-reports-create' },
    form: { ...createForm, submit: issueReportActions.create },
  },
  detail: {
    permission: 'view-issue-reports',
    route: { name: 'issue-reports-detail', params: routeParams },
    title: 'Issue Report',
    detail: () => ({ ...detail, load: issueReportActions.detail }),
  },
  update: {
    permission: 'manage-issue-reports',
    route: { name: 'issue-reports-edit', params: routeParams },
    load: issueReportActions.detail,
    form: ({ id, record }) => {
      const canLink = permissions().can('view-activities')
      return {
        ...defineForm({
          schema: issueReportUpdateSchema,
          labels,
          fields: {
            status: { renderer: 'radio', props: { data: statusChoices, pick: 'id', view: 'name' } },
            activityId: {
              renderer: 'select',
              visible: canLink,
              props: { load: issueReportActions['repair-activities'], searchParameters: { reportId: id }, pick: 'id', view: 'name', clearable: true },
            },
          },
        }),
        initialData: { status: record.status, ...(canLink && { activityId: record.activityId }) },
        submit: (input: (typeof issueReportUpdateSchema)['_output']) => issueReportActions.update(id, input),
      }
    },
  },
})
