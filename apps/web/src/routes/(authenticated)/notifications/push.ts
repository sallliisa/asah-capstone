import { rpc } from '@/framework/rpc'

const ownerStorageKey = 'kos-push-owner'

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function registerWorker() {
  if (!('serviceWorker' in navigator)) throw new Error('This browser does not support the app service worker.')
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

export async function enablePush() {
  if (!pushSupported()) throw new Error('On iPhone, add this app to the Home Screen and open it there to enable notifications.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted. You can change it in device settings.')
  const response = await rpc.notifications.subscription.$get()
  const result = await response.json()
  if (!response.ok || !('publicKey' in result) || !result.publicKey) throw new Error('Push delivery is not configured on the server yet.')
  const padded = result.publicKey.replace(/-/g, '+').replace(/_/g, '/')
  const applicationServerKey = Uint8Array.from(atob(padded), (value) => value.charCodeAt(0))
  await registerWorker()
  const registration = await navigator.serviceWorker.ready
  const subscription = (await registration.pushManager.getSubscription()) ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }))
  const keys = subscription.toJSON().keys
  if (!keys?.p256dh || !keys.auth) throw new Error('The browser returned an incomplete subscription.')
  const saved = await rpc.notifications.subscription.$post({ json: { endpoint: subscription.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } } })
  if (!saved.ok) throw new Error('Could not register this device for notifications.')
  const resultOwner = await saved.json()
  if ('recipientId' in resultOwner) localStorage.setItem(ownerStorageKey, resultOwner.recipientId)
}

export async function disablePush() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  let confirmed = false
  try {
    const result = await rpc.notifications.subscription.$delete({ json: { endpoint: subscription.endpoint } })
    confirmed = result.ok
  } finally {
    await subscription.unsubscribe()
    localStorage.removeItem(ownerStorageKey)
  }
  if (!confirmed) throw new Error('Device unsubscribed, but server cleanup could not be confirmed.')
}

export async function reconcilePushOwner(userId: string) {
  const previousOwner = localStorage.getItem(ownerStorageKey)
  if (previousOwner && previousOwner !== userId) await disablePush()
}
