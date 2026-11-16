self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { payload = {} }
  event.waitUntil(self.registration.showNotification(payload.title || 'Kos De Mansion', {
    body: payload.body || 'A new notification is available.',
    tag: payload.id || 'kos-notification',
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    data: { url: payload.url || '/notifications' },
  }))
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/notifications', self.location.origin)
  if (target.origin !== self.location.origin) return
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find((client) => new URL(client.url).origin === target.origin)
    if (existing) {
      await existing.navigate(target.href)
      await existing.focus()
    } else await self.clients.openWindow(target.href)
  })())
})
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(fetch(event.request).catch(() => new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kos De Mansion</title><main><h1>You are offline</h1><p>Connect to the internet to open your records.</p><button onclick="location.reload()">Retry</button></main></html>', { headers: { 'Content-Type': 'text/html' } })))
})
