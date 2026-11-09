import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recurringPlansCreateSchema } from '../recurring-plans/recurring-plans.schema'
import { activitiesCreateSchema, activitiesListQuerySchema, activitiesQuerySchema, activitiesUpdateSchema, activityCreateInitialData } from './activities.schema'

const payment = {
  name: 'Water bottles',
  financialKind: 'expense',
  categoryId: 'category-guest-supplies',
  amount: 75000,
  paymentStatus: 'settled',
  paymentDate: '2026-11-09',
  workStatus: 'completed',
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2031-04-05T18:30:00.000Z'))
})

afterEach(() => vi.useRealTimers())

describe('activity form conversion', () => {
  it('clears hidden payment fields when an activity no longer involves money', () => {
    const result = activitiesUpdateSchema.parse({ ...payment, name: 'Room cleaning', financialKind: 'none', workStatus: 'planned' })
    expect(result).toMatchObject({ financialKind: 'none', categoryId: 'category-guest-supplies', amount: null, paymentStatus: null, paymentDate: null, receipt: null, workStatus: 'planned' })
  })

  it('keeps completed work independent from a draft payment', () => {
    const result = activitiesUpdateSchema.parse({ ...payment, paymentStatus: 'draft', amount: null })
    expect(result).toMatchObject({ workStatus: 'completed', paymentStatus: 'draft', amount: null, paymentDate: null })
  })

  it('preserves a settled payment and its actual date when work still needs follow-up', () => {
    const result = activitiesUpdateSchema.parse({ ...payment, workStatus: 'in_progress' })
    expect(result).toMatchObject({ workStatus: 'in_progress', amount: 75000, paymentStatus: 'settled', paymentDate: '2026-11-09' })
  })

  it('submits manual activity creation without work or payment status fields', () => {
    const result = activitiesCreateSchema.parse({ ...activityCreateInitialData('expense'), name: 'Water bottles', categoryId: 'category-guest-supplies', amount: 75000 })
    expect(result).toMatchObject({ financialKind: 'expense', categoryId: 'category-guest-supplies', amount: 75000, paymentDate: '2031-04-06' })
    expect(result).not.toHaveProperty('workStatus')
    expect(result).not.toHaveProperty('paymentStatus')
    const cleaning = activitiesCreateSchema.parse({ ...activityCreateInitialData(undefined), name: 'Room cleaning', categoryId: 'category-cleaning' })
    expect(cleaning).toMatchObject({ financialKind: 'none', categoryId: 'category-cleaning', amount: null, paymentDate: null })
    expect(cleaning).not.toHaveProperty('workStatus')
    expect(cleaning).not.toHaveProperty('paymentStatus')
  })

  it('defaults missing actual dates to today in Jakarta for income and expenses', () => {
    for (const financialKind of ['income', 'expense']) {
      const result = activitiesUpdateSchema.parse({ ...payment, financialKind, paymentDate: null })
      expect(result).toMatchObject({ financialKind, workStatus: 'completed', paymentStatus: 'settled', paymentDate: '2031-04-06' })
    }
  })

  it('does not send scheduled or completion dates through the editable form', () => {
    const result = activitiesUpdateSchema.parse({ ...payment, scheduledDate: '2031-04-01', occurrenceDate: '2031-04-01', completedDate: '2031-04-02' })
    expect(result).not.toHaveProperty('scheduledDate')
    expect(result).not.toHaveProperty('occurrenceDate')
    expect(result).not.toHaveProperty('completedDate')
    expect(result).toMatchObject({ workStatus: 'completed', paymentDate: '2026-11-09' })
  })

  it('keeps an uploaded receipt as an asset object for the write boundary', () => {
    const result = activitiesCreateSchema.parse({ ...payment, receipt: { kind: 'file', id: 'uploads/receipt-proof.pdf', url: 'https://example.invalid/receipt.pdf', name: 'Receipt.pdf' } })
    expect(result.receipt).toMatchObject({ kind: 'file', id: 'uploads/receipt-proof.pdf', name: 'Receipt.pdf' })
  })

  it('retains the mastered category when a recurring plan has no financial details', () => {
    const result = recurringPlansCreateSchema.parse({ name: 'Cleaning', categoryId: 'category-cleaning', startDate: '2031-04-06', financialKind: 'none', amount: 75000 })
    expect(result).toMatchObject({ categoryId: 'category-cleaning', financialKind: 'none', amount: null })
  })

  it('does not submit caller-supplied status flags or allow zero-value purchases', () => {
    const result = activitiesCreateSchema.parse({ ...payment, workStatus: 'planned', paymentStatus: 'draft' })
    expect(result).not.toHaveProperty('workStatus')
    expect(result).not.toHaveProperty('paymentStatus')
    expect(activitiesCreateSchema.safeParse({ ...payment, amount: 0 }).success).toBe(false)
  })

  it('does not interpret a false financial filter as true', () => {
    expect(activitiesQuerySchema.parse({ financialOnly: 'false' }).financialOnly).toBe(false)
    expect(activitiesQuerySchema.parse({ financialOnly: 'true' }).financialOnly).toBe(true)
    expect(activitiesListQuerySchema.parse({ financialOnly: 'false', search: 'Water' })).toEqual({ search: 'Water' })
  })
})
