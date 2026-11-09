import { afterAll, describe, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod/v4'
import { app } from '../../../app'
import { closeDb, getDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { activities } from '../activities/activities.table'
import { activityPublicSchema } from '../activities/schema'
import { recurringPlans } from '../recurring-plans/recurring-plans.table'
import { recurringPlanPublicSchema } from '../recurring-plans/schema'
import { activityCategories } from './activity-categories.table'
import { activityCategorySelectSchema } from './schema'

const categoryIds: string[] = []
const activityIds: string[] = []
const planIds: string[] = []
const prefix = `category-${crypto.randomUUID().slice(0, 8)}`

function request(path: string, method: string, cookie?: string, body?: object) {
  return app.request(path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

afterAll(async () => {
  if (activityIds.length) await getDb().delete(activities).where(inArray(activities.id, activityIds))
  if (planIds.length) await getDb().delete(recurringPlans).where(inArray(recurringPlans.id, planIds))
  if (categoryIds.length) await getDb().delete(activityCategories).where(inArray(activityCategories.id, categoryIds))
  await closeDb()
})

describe('Activity Categories', () => {
  it('classifies every activity, reflects category renames, and protects referenced categories', async () => {
    const manager = await createSystemSession(['view-activity-categories', 'create-activity-categories', 'update-activity-categories', 'delete-activity-categories', 'view-activities', 'create-activities', 'update-activities', 'create-recurring-plans', 'view-recurring-plans'], 'category-manager')
    const createCategory = async (name: string) => {
      const response = await request('/activity-categories/create', 'POST', manager.cookie, { name })
      expect(response.status).toBe(201)
      const category = z.object({ data: activityCategorySelectSchema }).parse(await response.json()).data
      categoryIds.push(category.id)
      return category
    }
    const cleaningCategory = await createCategory(`${prefix} Cleaning`)
    const suppliesCategory = await createCategory(`${prefix} Supplies`)
    const planCategory = await createCategory(`${prefix} Maintenance`)
    const createActivity = async (input: object) => {
      const response = await request('/activities/create', 'POST', manager.cookie, input)
      expect(response.status).toBe(201)
      const row = z.object({ data: activityPublicSchema }).parse(await response.json()).data
      activityIds.push(row.id)
      return row
    }
    const cleaning = await createActivity({ name: `${prefix} room cleaning`, categoryId: cleaningCategory.id })
    expect(cleaning).toMatchObject({ categoryId: cleaningCategory.id, categoryName: cleaningCategory.name, financialKind: 'none', paymentStatus: null, workStatus: 'completed' })
    expect((await getDb().select().from(activities).where(eq(activities.id, cleaning.id)))[0].categoryId).toBe(cleaningCategory.id)
    await createActivity({ name: `${prefix} supplies`, categoryId: suppliesCategory.id, financialKind: 'expense', amount: 25000 })
    expect((await request(`/activity-categories/update/${cleaningCategory.id}`, 'PATCH', manager.cookie, { name: `${prefix} Housekeeping` })).status).toBe(200)
    const detail = z.object({ data: activityPublicSchema }).parse(await (await request(`/activities/detail/${cleaning.id}`, 'GET', manager.cookie)).json()).data
    expect(detail.categoryName).toBe(`${prefix} Housekeeping`)
    const list = z.object({ data: z.array(activityPublicSchema), total: z.number() }).parse(await (await request(`/activities/list?search=${prefix}&categoryId=${cleaningCategory.id}`, 'GET', manager.cookie)).json())
    expect(list.total).toBe(1)
    expect(list.data.map((row) => row.id)).toEqual([cleaning.id])
    expect((await request(`/activities/update/${cleaning.id}`, 'PATCH', manager.cookie, { financialKind: 'income', amount: 75000, paymentStatus: 'settled' })).status).toBe(200)
    const totals = z.object({ data: z.array(z.object({ income: z.number(), expenses: z.number(), net: z.number() })) }).parse(await (await request(`/activities/summary?search=${prefix}&categoryId=${cleaningCategory.id}`, 'GET', manager.cookie)).json()).data[0]
    expect(totals).toMatchObject({ income: 75000, expenses: 0, net: 75000 })
    expect((await request(`/activity-categories/delete/${cleaningCategory.id}`, 'DELETE', manager.cookie)).status).toBe(409)
    const planResponse = await request('/recurring-plans/create', 'POST', manager.cookie, { name: `${prefix} routine`, categoryId: planCategory.id, startDate: '2035-01-01' })
    expect(planResponse.status).toBe(201)
    const plan = z.object({ data: recurringPlanPublicSchema }).parse(await planResponse.json()).data
    planIds.push(plan.id)
    expect(plan).toMatchObject({ categoryId: planCategory.id, categoryName: planCategory.name, financialKind: 'none' })
    expect((await request(`/activity-categories/delete/${planCategory.id}`, 'DELETE', manager.cookie)).status).toBe(409)
    expect((await request('/activities/create', 'POST', manager.cookie, { name: `${prefix} invalid`, categoryId: 'missing-category' })).status).toBe(400)
    expect(await getDb().select().from(activities).where(eq(activities.name, `${prefix} invalid`))).toHaveLength(0)
    expect((await request('/recurring-plans/create', 'POST', manager.cookie, { name: `${prefix} invalid plan`, startDate: '2035-01-01', categoryId: 'missing-category' })).status).toBe(400)
    const removable = await createCategory(`${prefix} Temporary`)
    expect((await request(`/activity-categories/delete/${removable.id}`, 'DELETE', manager.cookie)).status).toBe(200)
    expect(await getDb().select().from(activityCategories).where(eq(activityCategories.id, removable.id))).toHaveLength(0)
    const defaultDelete = await request('/activity-categories/delete/activity-category-general', 'DELETE', manager.cookie)
    expect(defaultDelete.status).toBe(409)
    expect(await defaultDelete.json()).toMatchObject({ error: 'default_category_required' })
  })

  it('keeps picker access separate from category management permissions', async () => {
    const reader = await createSystemSession(['view-activities', 'view-recurring-plans'], 'category-picker')
    const choices = await request('/activities/categories', 'GET', reader.cookie)
    expect(choices.status).toBe(200)
    const data = z.object({ data: z.array(z.object({ id: z.string(), name: z.string() })) }).parse(await choices.json()).data
    expect(data).toContainEqual({ id: 'activity-category-general', name: 'General' })
    expect((await request('/recurring-plans/categories', 'GET', reader.cookie)).status).toBe(200)
    for (const [path, method] of [['list', 'GET'], ['detail/missing', 'GET'], ['create', 'POST'], ['update/missing', 'PATCH'], ['delete/missing', 'DELETE']]) {
      expect((await request(`/activity-categories/${path}`, method)).status).toBe(401)
      expect((await request(`/activity-categories/${path}`, method, reader.cookie)).status).toBe(403)
    }
  })
})
