import { defineDetail, defineForm, defineResource, defineTable, type FormFieldContext } from '@southneuhof/loom'
import { defaultTaskTarget } from '@southneuhof/api/src/routes/(authenticated)/activities/schema.ts'
import { permissions } from '@/stores/permissions'
import { financialKinds, taskTargets } from '../activities/activities.resource'
import { activityToday } from '../activities/activities.schema'
import { recurringPlansActions } from './recurring-plans.actions'
import { recurringPlansCreateSchema, recurringPlansRecordSchema, recurringPlansUpdateSchema } from './recurring-plans.schema'

const labels = {
  name: 'Plan name',
  description: 'Description',
  roomId: 'Room',
  tenantId: 'Tenant',
  tenantName: 'Tenant',
  roomName: 'Room',
  startDate: 'First due date',
  intervalCount: 'Repeat every',
  intervalUnit: 'Interval unit',
  leadDays: 'Open task days before due',
  active: 'Active',
  financialKind: 'Financial template',
  categoryId: 'Category',
  categoryName: 'Category',
  amount: 'Expected amount',
  taskTarget: 'Close task when',
  nextOccurrenceDate: 'Next due date to schedule',
}
const activeDisplay = { renderer: 'chip', props: { options: { true: { label: 'Active', color: 'success' }, false: { label: 'Paused', color: 'warning' } } } } as const
const intervalDisplay = { read: (record: { intervalUnit: string }) => ({ day: 'Days', week: 'Weeks', month: 'Months' })[record.intervalUnit] ?? record.intervalUnit }
const table = defineTable({
  schema: recurringPlansRecordSchema,
  labels,
  columns: {
    name: { sortable: true },
    categoryName: {},
    roomName: {},
    tenantName: {},
    intervalCount: {},
    intervalUnit: intervalDisplay,
    leadDays: {},
    nextOccurrenceDate: { format: 'date', sortable: true },
    active: activeDisplay,
  },
})
const detail = defineDetail({
  schema: recurringPlansRecordSchema,
  labels,
  fields: {
    name: {},
    description: {},
    roomName: {},
    tenantName: {},
    startDate: { format: 'date' },
    intervalCount: {},
    intervalUnit: intervalDisplay,
    leadDays: {},
    active: activeDisplay,
    financialKind: { read: (record: { financialKind: string }) => financialKinds.find((kind) => kind.id === record.financialKind)?.name ?? record.financialKind },
    categoryName: {},
    amount: { format: 'number' },
    taskTarget: { read: (record: (typeof recurringPlansRecordSchema)['_output']) => taskTargets.find(({ id }) => id === (record.taskTarget ?? defaultTaskTarget(record)))?.name },
    nextOccurrenceDate: { format: 'date' },
  },
})
type PlanInput = (typeof recurringPlansCreateSchema)['_input']
const fields = {
  name: { renderer: 'text' },
  categoryId: {
    renderer: 'select',
    initialValue: 'activity-category-general',
    props: { load: recurringPlansActions.categories, resource: 'activity-categories', pick: 'id', view: 'name', clearable: false },
  },
  roomId: { renderer: 'select', props: { load: recurringPlansActions.rooms, pick: 'id', view: 'name', clearable: true } },
  tenantId: { renderer: 'select', props: { load: recurringPlansActions.tenants, resource: 'users', pick: 'id', view: 'name', clearable: true } },
  startDate: { renderer: 'date', initialValue: activityToday },
  intervalCount: { renderer: 'number', initialValue: () => 1 },
  leadDays: { renderer: 'number', initialValue: () => 7, props: { helperMessage: 'Use 0 to open the task on its due date.' } },
  intervalUnit: {
    renderer: 'radio',
    initialValue: 'week',
    props: {
      data: [
        { id: 'day', name: 'Days' },
        { id: 'week', name: 'Weeks' },
        { id: 'month', name: 'Months' },
      ],
      pick: 'id',
      view: 'name',
      direction: 'column',
    },
  },
  active: { renderer: 'switch', initialValue: () => true },
  description: { renderer: 'textarea' },
  financialKind: { renderer: 'radio', initialValue: 'none', props: { data: financialKinds, pick: 'id', view: 'name', direction: 'column' } },
  amount: ({ draft }: FormFieldContext<PlanInput, {}>) => ({ renderer: 'number', visible: draft.financialKind !== 'none' }) as const,
  taskTarget: ({ draft }: FormFieldContext<PlanInput, {}>) =>
    ({
      renderer: 'radio',
      visible: draft.financialKind !== 'none',
      props: { data: taskTargets, pick: 'id', view: 'name', direction: 'column' },
    }) as const,
} as const
const createForm = defineForm({ schema: recurringPlansCreateSchema, labels, fields })

export const recurringPlans = defineResource({
  key: 'recurring-plans',
  identity: (record: { id: string }) => record.id,
  list: { permission: 'view-recurring-plans', route: { name: 'recurring-plans' }, table: { ...table, load: recurringPlansActions.list } },
  create: { permission: 'create-recurring-plans', route: { name: 'recurring-plans-create' }, form: { ...createForm, submit: recurringPlansActions.create } },
  detail: {
    permission: 'view-recurring-plans',
    route: { name: 'recurring-plans-detail', params: (id) => ({ planId: id }) },
    title: 'Recurring Plan',
    detail: () => ({ ...detail, load: recurringPlansActions.detail }),
  },
  update: {
    permission: 'update-recurring-plans',
    route: { name: 'recurring-plans-edit', params: (id) => ({ planId: id }) },
    load: recurringPlansActions.detail,
    form: ({ id, record }) => {
      const canEditTenant = permissions().can('view-users')
      return {
        ...defineForm({
          schema: recurringPlansUpdateSchema,
          labels,
          fields: {
            ...fields,
            tenantId: { ...fields.tenantId, visible: canEditTenant },
            startDate: ({ draft }) => ({
              ...fields.startDate,
              ...(draft.startDate &&
                draft.startDate !== record.startDate && {
                  props: { helperMessage: 'Upcoming dates before the new start date are skipped.' },
                }),
            }),
            active: ({ draft }) => ({
              ...fields.active,
              ...(draft.active &&
                !record.active &&
                record.nextOccurrenceDate < activityToday() && {
                  props: { helperMessage: 'Reactivating this plan can generate missed activities.' },
                }),
            }),
          },
        }),
        initialData: {
          name: record.name,
          description: record.description,
          roomId: record.roomId,
          tenantId: record.tenantId,
          startDate: record.startDate,
          intervalCount: record.intervalCount,
          intervalUnit: record.intervalUnit,
          leadDays: record.leadDays,
          active: record.active,
          financialKind: record.financialKind,
          categoryId: record.categoryId,
          amount: record.amount,
          taskTarget: record.taskTarget,
        },
        submit: ({ tenantId, ...output }: (typeof recurringPlansUpdateSchema)['_output']) => recurringPlansActions.update(id, canEditTenant ? { ...output, tenantId } : output),
      }
    },
  },
})
