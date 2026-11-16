import { afterAll, expect, it, vi } from 'vitest'
import { app } from '../../../app'
import { closeDb } from '../../../db'
import { createSystemSession } from '../../../testing/session'
import { cloudflareSession } from './cloudflare-session'

vi.mock('./cloudflare-session', () => ({ cloudflareSession: vi.fn().mockResolvedValue({ url: 'https://os.example.invalid', session: { token: 'native-owner-token', accountId: 'native-owner' } }) }))
const savedEmail = process.env.CARTA_ADMIN_EMAIL

afterAll(async () => {
  if (savedEmail === undefined) delete process.env.CARTA_ADMIN_EMAIL
  else process.env.CARTA_ADMIN_EMAIL = savedEmail
  await closeDb()
})

it('hands a native shared-account session only to the configured app owner', async () => {
  const owner = await createSystemSession([], 'pi-owner')
  const other = await createSystemSession(['view-users', 'view-activities'], 'pi-other')
  process.env.CARTA_ADMIN_EMAIL = `${owner.userId}@example.invalid`
  const request = (cookie?: string) => app.request('/pi/session', { method: 'POST', headers: cookie ? { cookie } : {} })
  expect((await request()).status).toBe(401)
  expect((await request(other.cookie)).status).toBe(403)
  expect(cloudflareSession).not.toHaveBeenCalled()
  const response = await request(owner.cookie)
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
})
