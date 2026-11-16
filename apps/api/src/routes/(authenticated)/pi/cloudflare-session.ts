import { newWebSocketRpcSession } from 'capnweb'
import { argon2id } from 'hash-wasm'
import { z } from 'zod/v4'
import { piSessionSchema } from './schema'

interface NativeAccount {
  whoami(): Promise<unknown>
}
interface NativePublic {
  getServerConfig(): Promise<unknown>
  login(username: string, passwordHash: Uint8Array): Promise<unknown>
  authenticate(token: string): Promise<NativeAccount>
}
let cached: { key: string; expiresAt: number; token: string; accountId: string } | undefined

export async function cloudflareSession() {
  const input = z.object({ url: z.url(), username: z.string().min(1), password: z.string().min(1) }).parse({ url: process.env.CLOUDFLARE_OS_URL, username: process.env.CLOUDFLARE_OS_USERNAME, password: process.env.CLOUDFLARE_OS_PASSWORD })
  const endpoint = new URL(input.url)
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw new Error('Invalid CloudflareOS URL')
  const key = JSON.stringify(input)
  endpoint.protocol = 'wss:'
  endpoint.pathname = '/api'
  endpoint.search = ''
  endpoint.hash = ''
  const api = newWebSocketRpcSession<NativePublic>(endpoint.toString())
  const timer = setTimeout(() => api[Symbol.dispose](), 15000)
  try {
    if (cached?.key === key && cached.expiresAt > Date.now()) {
      try {
        const account = await api.authenticate(cached.token)
        const profile = z.object({ id: z.string() }).parse(await account.whoami())
        if (profile.id === cached.accountId) return piSessionSchema.parse({ url: input.url, session: { token: cached.token, accountId: profile.id } })
      } catch { cached = undefined }
    }
    const config = z.object({ passwordAuthEnabled: z.boolean() }).parse(await api.getServerConfig())
    if (!config.passwordAuthEnabled) throw new Error('Password login is unavailable')
    const prefix = Uint8Array.from([0xd9, 0x4e, 0x54, 0x1d, 0x29, 0xc1, 0x03, 0x74, 0x73, 0x7e, 0xb3, 0xe3, 0x34, 0x6d, 0x8f, 0x21])
    const name = new TextEncoder().encode(input.username)
    const salt = new Uint8Array(prefix.length + name.length)
    salt.set(prefix)
    salt.set(name, prefix.length)
    const hash = await argon2id({ password: input.password, salt, parallelism: 1, iterations: 3, memorySize: 65536, hashLength: 32, outputType: 'binary' })
    const token = z.string().min(1).parse(await api.login(input.username, hash))
    const account = await api.authenticate(token)
    const profile = z.object({ id: z.string().min(1) }).parse(await account.whoami())
    cached = { key, token, accountId: profile.id, expiresAt: Date.now() + 600000 }
    return piSessionSchema.parse({ url: input.url, session: { token, accountId: profile.id } })
  } finally {
    clearTimeout(timer)
    api[Symbol.dispose]()
  }
}
