import { defineDetail, defineForm, defineResource, defineTable, type FormFieldContext } from '@southneuhof/loom'
import { financialKinds } from '../activities/activities.resource'
import { activityToday } from '../activities/activities.schema'
import { recurringPlansActions } from './recurring-plans.actions'
import { recurringPlansCreateSchema, recurringPlansRecordSchema, recurringPlansUpdateSchema } from './recurring-plans.schema'

const labels = {
  name: 'Plan name',
  description: 'Description',
  roomId: 'Room',
  roomName: 'Room',
  startDate: 'First date',
  intervalCount: 'Repeat every',
  intervalUnit: 'Interval unit',
  active: 'Active',
  financialKind: 'Financial template',
  categoryId: 'Category',
  categoryName: 'Category',
  amount: 'Expected amount',
  nextOccurrenceDate: 'Next occurrence',
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
    intervalCount: {},
    intervalUnit: intervalDisplay,
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
    startDate: { format: 'date' },
    intervalCount: {},
    intervalUnit: intervalDisplay,
    active: activeDisplay,
    financialKind: { read: (record: { financialKind: string }) => financialKinds.find((kind) => kind.id === record.financialKind)?.name ?? record.financialKind },
    categoryName: {},
    amount: { format: 'number' },
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
  startDate: { renderer: 'date', initialValue: activityToday },
  intervalCount: { renderer: 'number', initialValue: () => 1 },
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
      const locked = record.occurrenceIndex > 0
      return {
        ...defineForm({
          schema: recurringPlansUpdateSchema,
          labels,
          fields: {
            ...fields,
            startDate: { ...fields.startDate, props: { disabled: locked } },
            intervalCount: { ...fields.intervalCount, props: { disabled: locked } },
            intervalUnit: { ...fields.intervalUnit, props: { ...fields.intervalUnit.props, disabled: locked } },
          },
        }),
        initialData: {
          name: record.name,
          description: record.description,
          roomId: record.roomId,
          startDate: record.startDate,
          intervalCount: record.intervalCount,
          intervalUnit: record.intervalUnit,
          active: record.active,
          financialKind: record.financialKind,
          categoryId: record.categoryId,
          amount: record.amount,
        },
        submit: (output: (typeof recurringPlansUpdateSchema)['_output']) => recurringPlansActions.update(id, output),
      }
    },
  },
})
