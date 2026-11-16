export {}

const endpoint = process.env.APP_API_URL ?? process.env.BETTER_AUTH_URL
const secret = process.env.JOB_SECRET
if (!endpoint || !secret) throw new Error('APP_API_URL and JOB_SECRET are required.')
const response = await fetch(new URL(`${endpoint.replace(/\/$/, '')}/internal/jobs`), { method: 'POST', headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(45000) })
if (!response.ok) throw new Error(`Scheduled job failed with HTTP ${response.status}.`)
console.log(JSON.stringify(await response.json()))
