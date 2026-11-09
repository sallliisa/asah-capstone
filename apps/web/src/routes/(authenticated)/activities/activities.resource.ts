import { defineDetail, defineForm, defineResource, defineTable, type DetailFieldContext, type FormFieldContext, type ListFilters } from '@southneuhof/loom'
import { activitiesActions } from './activities.actions'
import { activitiesCreateSchema, activitiesRecordSchema, activitiesUpdateSchema, activitiesListQuerySchema, activityFiltersSchema, activityToday } from './activities.schema'

export const workStates = [
  { id: 'planned', name: 'Planned' },
  { id: 'in_progress', name: 'In progress' },
  { id: 'completed', name: 'Completed' },
  { id: 'cancelled', name: 'Cancelled' },
] as const
export const financialKinds = [
  { id: 'none', name: 'No financial details' },
  { id: 'income', name: 'Income' },
  { id: 'expense', name: 'Expense' },
] as const
export const paymentStates = [
  { id: 'draft', name: 'Draft' },
  { id: 'settled', name: 'Settled' },
] as const
const workDisplay = {
  renderer: 'chip',
  props: {
    options: {
      planned: { label: 'Planned', color: 'info' },
      in_progress: { label: 'In progress', color: 'warning' },
      completed: { label: 'Completed', color: 'success' },
      cancelled: { label: 'Cancelled', color: 'error' },
    },
  },
} as const
const financeDisplay = {
  renderer: 'chip',
  props: { options: { none: { label: 'No financial details' }, income: { label: 'Income', color: 'success' }, expense: { label: 'Expense', color: 'warning' } } },
} as const
const paymentDisplay = { renderer: 'chip', props: { options: { draft: { label: 'Draft', color: 'warning' }, settled: { label: 'Settled', color: 'success' } } } } as const
const labels = {
  name: 'Activity name',
  description: 'Description',
  roomId: 'Room',
  roomName: 'Room',
  workStatus: 'Work status',
  completedDate: 'Completion date',
  financialKind: 'Financial details',
  categoryId: 'Category',
  categoryName: 'Category',
  amount: 'Amount',
  paymentStatus: 'Payment status',
  paymentDate: 'Actual date',
  receipt: 'Receipt',
  planName: 'Recurring plan',
  occurrenceDate: 'Expected date',
}
const amountDisplay = { format: 'number' }
const table = defineTable({
  schema: activitiesRecordSchema,
  labels,
  columns: {
    name: { sortable: true },
    roomName: {},
    workStatus: workDisplay,
    financialKind: financeDisplay,
    categoryName: {},
    amount: { ...amountDisplay, sortable: true },
    paymentStatus: paymentDisplay,
    occurrenceDate: { format: 'date', sortable: true },
    paymentDate: { format: 'date', sortable: true },
  },
})
const detail = defineDetail({
  schema: activitiesRecordSchema,
  labels,
  fields: {
    name: {},
    description: {},
    roomName: {},
    workStatus: workDisplay,
    completedDate: { format: 'date' },
    financialKind: financeDisplay,
    categoryName: {},
    amount: amountDisplay,
    paymentStatus: paymentDisplay,
    paymentDate: ({ record }: DetailFieldContext<(typeof activitiesRecordSchema)['_output'], {}>) =>
      ({ label: record.financialKind === 'income' ? 'Date received' : 'Date paid', format: 'date' }) as const,
    receipt: { renderer: 'file' },
    planName: {},
    occurrenceDate: { format: 'date' },
  },
})
type CreateInput = (typeof activitiesCreateSchema)['_input']
type UpdateInput = (typeof activitiesUpdateSchema)['_input']
const activityFields = {
  name: { renderer: 'text' },
  categoryId: {
    renderer: 'select',
    initialValue: 'activity-category-general',
    props: { load: activitiesActions.categories, resource: 'activity-categories', pick: 'id', view: 'name', clearable: false },
  },
  roomId: { renderer: 'select', props: { load: activitiesActions.rooms, pick: 'id', view: 'name', clearable: true } },
  description: { renderer: 'textarea' },
} as const
const financialKindField = { renderer: 'radio', initialValue: 'none', props: { data: financialKinds, pick: 'id', view: 'name', direction: 'column' } } as const
const createFields = {
  ...activityFields,
  financialKind: financialKindField,
  amount: ({ draft }: FormFieldContext<CreateInput, {}>) => ({ renderer: 'number', visible: draft.financialKind !== 'none' }) as const,
  paymentDate: ({ draft }: FormFieldContext<CreateInput, {}>) =>
    ({ renderer: 'date', label: draft.financialKind === 'income' ? 'Date received' : 'Date paid', visible: draft.financialKind !== 'none', initialValue: activityToday }) as const,
  receipt: ({ draft }: FormFieldContext<CreateInput, {}>) => ({ renderer: 'file', visible: draft.financialKind !== 'none' }) as const,
} as const
const updateFields = {
  ...activityFields,
  workStatus: { renderer: 'radio', props: { data: workStates, pick: 'id', view: 'name', direction: 'column' } },
  financialKind: financialKindField,
  paymentStatus: ({ draft }: FormFieldContext<UpdateInput, {}>) =>
    ({ renderer: 'radio', visible: draft.financialKind !== 'none', initialValue: 'settled', props: { data: paymentStates, pick: 'id', view: 'name', direction: 'column' } }) as const,
  amount: ({ draft }: FormFieldContext<UpdateInput, {}>) => ({ renderer: 'number', visible: draft.financialKind !== 'none' }) as const,
  paymentDate: ({ draft }: FormFieldContext<UpdateInput, {}>) =>
    ({
      renderer: 'date',
      label: draft.financialKind === 'income' ? 'Date received' : 'Date paid',
      visible: draft.financialKind !== 'none' && draft.paymentStatus === 'settled',
      initialValue: activityToday,
    }) as const,
  receipt: ({ draft }: FormFieldContext<UpdateInput, {}>) => ({ renderer: 'file', visible: draft.financialKind !== 'none' }) as const,
} as const
const createForm = defineForm({ schema: activitiesCreateSchema, labels, fields: createFields })
const updateForm = defineForm({ schema: activitiesUpdateSchema, labels, fields: updateFields })

export const activityFilters: ListFilters<(typeof activitiesListQuerySchema)['_output'], (typeof activityFiltersSchema)['_input'], {}> = {
  schema: activityFiltersSchema,
  fields: {
    financialKind: { label: 'Financial details', renderer: 'radio', initialValue: '', props: { data: [{ id: '', name: 'All' }, ...financialKinds], pick: 'id', view: 'name', direction: 'column' } },
    paymentStatus: { label: 'Payment status', renderer: 'radio', initialValue: '', props: { data: [{ id: '', name: 'All' }, ...paymentStates], pick: 'id', view: 'name', direction: 'column' } },
    workStatus: { label: 'Work status', renderer: 'radio', initialValue: '', props: { data: [{ id: '', name: 'All' }, ...workStates], pick: 'id', view: 'name', direction: 'column' } },
    roomId: { label: 'Room', renderer: 'select', props: { load: activitiesActions.rooms, pick: 'id', view: 'name' } },
    paymentFrom: { label: 'Actual date from', renderer: 'date' },
    paymentTo: { label: 'Actual date to', renderer: 'date' },
    categoryId: { label: 'Category', renderer: 'select', props: { load: activitiesActions.categories, resource: 'activity-categories', pick: 'id', view: 'name' } },
  },
  queryKeys: ['financialKind', 'paymentStatus', 'workStatus', 'roomId', 'categoryId', 'paymentFrom', 'paymentTo'],
  toDraft: (query) => ({
    categoryId: typeof query.categoryId === 'string' ? query.categoryId : undefined,
    financialKind: typeof query.financialKind === 'string' ? query.financialKind : undefined,
    paymentStatus: typeof query.paymentStatus === 'string' ? query.paymentStatus : undefined,
    workStatus: typeof query.workStatus === 'string' ? query.workStatus : undefined,
    roomId: typeof query.roomId === 'string' ? query.roomId : undefined,
    paymentFrom: typeof query.paymentFrom === 'string' ? query.paymentFrom : undefined,
    paymentTo: typeof query.paymentTo === 'string' ? query.paymentTo : undefined,
  }),
}
type ActivityRecord = (typeof activitiesRecordSchema)['_output']
const activityParams = (id: string) => ({ activityId: id })
const activityDetail = () => ({ ...detail, load: activitiesActions.detail })
const saveNewActivity = (input: (typeof activitiesCreateSchema)['_output']): Promise<ActivityRecord> => activitiesActions.create(input)
const activityUpdateForm = ({ id, record }: { id: string; record: Readonly<ActivityRecord> }) => ({
  ...updateForm,
  initialData: {
    name: record.name,
    description: record.description,
    roomId: record.roomId,
    workStatus: record.workStatus,
    financialKind: record.financialKind,
    categoryId: record.categoryId,
    amount: record.amount,
    paymentStatus: record.paymentStatus,
    ...(record.paymentDate ? { paymentDate: record.paymentDate } : {}),
    receipt: record.receipt,
  },
  submit: (output: (typeof activitiesUpdateSchema)['_output']): Promise<ActivityRecord> => activitiesActions.update(id, output),
})
export const activities = defineResource({
  key: 'activities',
  identity: (record: { id: string }) => record.id,
  actions: { rooms: activitiesActions.rooms, summary: activitiesActions.summary },
  list: { permission: 'view-activities', route: { name: 'activities' }, table: { ...table, load: activitiesActions.list } },
  create: { permission: 'create-activities', route: { name: 'activities-create' }, form: { ...createForm, submit: saveNewActivity } },
  detail: { permission: 'view-activities', route: { name: 'activities-detail', params: activityParams }, title: 'Activity', detail: activityDetail },
  update: { permission: 'update-activities', route: { name: 'activities-edit', params: activityParams }, load: activitiesActions.detail, form: activityUpdateForm },
})
