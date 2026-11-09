import { defineDetail, defineForm, defineResource, defineTable } from '@southneuhof/loom'
import { roomTypesActions } from './room-types.actions'
import { roomTypesCreateSchema, roomTypesRecordSchema, roomTypesUpdateSchema } from './room-types.schema'

const labels = { name: 'Name', cost: 'Cost' }
const costDisplay = { format: 'number' }
const table = defineTable({ schema: roomTypesRecordSchema, labels, columns: { name: { sortable: true }, cost: { ...costDisplay, sortable: true } } })
const detail = defineDetail({ schema: roomTypesRecordSchema, labels, fields: { name: {}, cost: costDisplay } })
const fields = { name: { renderer: 'text' }, cost: { renderer: 'number' } } as const
const createForm = defineForm({ schema: roomTypesCreateSchema, labels, fields })
const updateForm = defineForm({ schema: roomTypesUpdateSchema, labels, fields })

export const roomTypes = defineResource({
  key: 'room-types',
  identity: (record: { id: string }) => record.id,
  list: { permission: 'view-room-types', route: { name: 'room-types' }, table: { ...table, load: roomTypesActions.list } },
  create: { permission: 'create-room-types', route: { name: 'room-types-create' }, form: { ...createForm, submit: roomTypesActions.create } },
  detail: {
    permission: 'view-room-types',
    route: { name: 'room-types-detail', params: (id) => ({ roomTypeId: id }) },
    title: 'Room Type',
    detail: () => ({ ...detail, load: roomTypesActions.detail }),
  },
  update: {
    permission: 'update-room-types',
    route: { name: 'room-types-edit', params: (id) => ({ roomTypeId: id }) },
    load: roomTypesActions.detail,
    form: ({ id, record }) => ({
      ...updateForm,
      initialData: { name: record.name, cost: record.cost },
      submit: (output: (typeof roomTypesUpdateSchema)['_output']) => roomTypesActions.update(id, output),
    }),
  },
  delete: { permission: 'delete-room-types', run: (record) => roomTypesActions.delete(record.id) },
})
