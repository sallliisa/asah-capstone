import { boolean, date, doublePrecision, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from '../users/users.table'
import { rooms } from '../rooms/rooms.table'

export const tenantDetectorCoverage = pgTable('tenant_detector_coverage', {
  tenantId: text('tenant_id').primaryKey().references(() => users.id, { onDelete: 'restrict' }),
  repairsFrom: date('repairs_from'),
  cleaningFrom: date('cleaning_from'),
  rentFrom: date('rent_from'),
  repairCostsComplete: boolean('repair_costs_complete').notNull().default(false),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  confirmedBy: text('confirmed_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
})

export const tenantDetectorPredictions = pgTable('tenant_detector_predictions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  asOfDate: date('as_of_date').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  sourceRevision: integer('source_revision').notNull(),
  inputHash: text('input_hash').notNull(),
  modelVersion: text('model_version').notNull(),
  featureVersion: text('feature_version').notNull(),
  input: jsonb('input').notNull(),
  result: jsonb('result').notNull(),
  grade: text('grade'),
  score: doublePrecision('score'),
}, (table) => [uniqueIndex('tenant_detector_prediction_input').on(table.tenantId, table.asOfDate, table.inputHash, table.modelVersion)])

export const tenantDetectorState = pgTable('tenant_detector_state', {
  tenantId: text('tenant_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  sourceRevision: integer('source_revision').notNull().default(1),
  pending: boolean('pending').notNull().default(true),
  lastAttempt: timestamp('last_attempt', { withTimezone: true, mode: 'string' }),
  error: text('error'),
  latestPredictionId: text('latest_prediction_id').references(() => tenantDetectorPredictions.id, { onDelete: 'restrict' }),
  dailyDate: date('daily_date'),
})

export const tenantDetectorPredictionRooms = pgTable('tenant_detector_prediction_rooms', {
  predictionId: text('prediction_id').notNull().references(() => tenantDetectorPredictions.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'restrict' }),
}, (table) => [uniqueIndex('tenant_detector_prediction_room').on(table.predictionId, table.roomId)])
