import { processNotifications } from './routes/(authenticated)/notifications/deliver'
import { generateDueActivities } from './routes/(authenticated)/recurring-plans/generate'
import { processTenantDetector } from './routes/(authenticated)/tenant-detector/process'

async function runJob<T>(name: string, run: () => Promise<T>): Promise<T | { failed: true }> {
  try {
    return await run()
  } catch (error) {
    console.error(`${name} failed.`, error)
    return { failed: true }
  }
}

export async function runBackgroundJobs() {
  const recurrence = await runJob('Recurring activity generation', generateDueActivities)
  const [notifications, tenantDetector] = await Promise.all([
    runJob('Notification processing', processNotifications),
    runJob('Tenant assessment', processTenantDetector),
  ])
  return { recurrence, notifications, tenantDetector }
}

export function startBackgroundJobWorker() {
  let running = false
  const run = async () => {
    if (running) return
    running = true
    try {
      await runBackgroundJobs()
    } finally {
      running = false
    }
  }
  void run()
  const timer = setInterval(() => { void run() }, 60_000)
  timer.unref()
  return () => clearInterval(timer)
}
