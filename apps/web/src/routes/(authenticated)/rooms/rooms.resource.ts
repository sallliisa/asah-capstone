import { defineDetail, defineForm, defineResource, defineTable } from '@southneuhof/loom'
import { appDisplayPresets } from '@/configs/display-presets'
import { appInputPresets } from '@/configs/input-presets'
import { roomsActions } from './rooms.actions'
import { roomsCreateSchema, roomsRecordSchema, roomsUpdateSchema } from './rooms.schema'

const roomLabels = {
  roomCode: 'Room Code',
  name: 'Room Name',
  description: 'Description',
  createdAt: 'Created At',
  occupantId: 'Occupant',
  roomTypeId: 'Room Type',
  occupantName: 'Occupant',
  roomTypeName: 'Room Type',
}

const roomsTable = defineTable({
  schema: roomsRecordSchema,
  labels: roomLabels,
  columns: {
    roomCode: { sortable: true },
    name: { sortable: true },
    roomTypeName: {},
    occupantName: {},
  },
})

const roomDetail = defineDetail({
  schema: roomsRecordSchema,
  labels: roomLabels,
  fields: {
    roomCode: {},
    name: {},
    description: {},
    roomTypeName: {},
    occupantName: {},
    createdAt: appDisplayPresets.createdAt,
  },
})

const roomForm = defineForm({
  schema: roomsCreateSchema,
  labels: roomLabels,
  fields: {
    roomCode: { renderer: 'text' },
    name: appInputPresets.name,
    description: appInputPresets.description,
    roomTypeId: { renderer: 'select', initialValue: () => 'room-type-standard', props: { load: roomsActions.roomTypes, pick: 'id', view: 'name', clearable: false } },
    occupantId: { renderer: 'select', props: { load: roomsActions.occupants, pick: 'id', view: 'name', clearable: true } },
  },
})

const roomUpdateForm = defineForm({
  schema: roomsUpdateSchema,
  labels: roomLabels,
  fields: {
    roomCode: { renderer: 'text' },
    name: appInputPresets.name,
    description: appInputPresets.description,
    roomTypeId: { renderer: 'select', initialValue: () => 'room-type-standard', props: { load: roomsActions.roomTypes, pick: 'id', view: 'name', clearable: false } },
    occupantId: { renderer: 'select', props: { load: roomsActions.occupants, pick: 'id', view: 'name', clearable: true } },
  },
})

const roomRouteParams = (id: string) => ({ roomId: id })
const loadRoomDetail = () => ({ ...roomDetail, load: roomsActions.detail })
const createRoomUpdateForm = ({ id, record }: { id: string; record: Readonly<(typeof roomsRecordSchema)['_output']> }) => ({
  ...roomUpdateForm,
  initialData: { roomCode: record.roomCode, name: record.name, description: record.description, occupantId: record.occupantId, roomTypeId: record.roomTypeId },
  submit: (output: (typeof roomsUpdateSchema)['_output']) => roomsActions.update(id, output),
})

export const rooms = defineResource({
  key: 'rooms',
  identity: (record: { id: string }) => record.id,
  actions: { list: roomsActions.list },
  list: {
    permission: 'view-rooms',
    route: { name: 'rooms' },
    table: { ...roomsTable, load: roomsActions.list },
  },
  create: {
    permission: 'create-rooms',
    route: { name: 'rooms-create' },
    form: { ...roomForm, submit: (output: (typeof roomsCreateSchema)['_output']) => roomsActions.create(output) },
  },
  detail: {
    permission: 'view-rooms',
    route: { name: 'rooms-detail', params: roomRouteParams },
    title: 'Detail Room',
    detail: loadRoomDetail,
  },
  update: {
    permission: 'update-rooms',
    route: { name: 'rooms-edit', params: roomRouteParams },
    load: roomsActions.detail,
    form: createRoomUpdateForm,
  },
  delete: { permission: 'delete-rooms', run: (record) => roomsActions.delete(record.id) },
})
