import { defineDetail, defineForm, defineResource, defineTable } from '@southneuhof/loom'
import { activities } from '../activities/activities.resource'
import { recurringPlans } from '../recurring-plans/recurring-plans.resource'
import { activityCategoriesActions } from './activity-categories.actions'
import { activityCategoriesCreateSchema, activityCategoriesRecordSchema, activityCategoriesUpdateSchema } from './activity-categories.schema'

const labels = { name: 'Name' }
const table = defineTable({ schema: activityCategoriesRecordSchema, labels, columns: { name: { sortable: true } } })
const detail = defineDetail({ schema: activityCategoriesRecordSchema, labels, fields: { name: {} } })
const fields = { name: { renderer: 'text' } } as const
const createForm = defineForm({ schema: activityCategoriesCreateSchema, labels, fields })
const updateForm = defineForm({ schema: activityCategoriesUpdateSchema, labels, fields })
const categoryDetailRoute = (record: { id: string }) => ({ name: 'activity-categories-detail', params: { categoryId: record.id } }) as const
async function refreshCategoryConsumers() {
  await Promise.all([activities.invalidate(), recurringPlans.invalidate()])
}

export const activityCategories = defineResource({
  key: 'activity-categories',
  identity: (record: { id: string }) => record.id,
  list: { permission: 'view-activity-categories', route: { name: 'activity-categories' }, table: { ...table, load: activityCategoriesActions.list } },
  create: {
    permission: 'create-activity-categories',
    route: { name: 'activity-categories-create' },
    form: { ...createForm, submit: activityCategoriesActions.create },
    afterSubmit: refreshCategoryConsumers,
    defaultTo: categoryDetailRoute,
  },
  detail: {
    permission: 'view-activity-categories',
    route: { name: 'activity-categories-detail', params: (id) => ({ categoryId: id }) },
    title: 'Activity Category',
    detail: () => ({ ...detail, load: activityCategoriesActions.detail }),
  },
  update: {
    permission: 'update-activity-categories',
    route: { name: 'activity-categories-edit', params: (id) => ({ categoryId: id }) },
    load: activityCategoriesActions.detail,
    form: ({ id, record }) => ({
      ...updateForm,
      initialData: { name: record.name },
      submit: (output: (typeof activityCategoriesUpdateSchema)['_output']) => activityCategoriesActions.update(id, output),
    }),
    afterSubmit: refreshCategoryConsumers,
    defaultTo: categoryDetailRoute,
  },
  delete: { permission: 'delete-activity-categories', run: (record) => activityCategoriesActions.delete(record.id) },
})
