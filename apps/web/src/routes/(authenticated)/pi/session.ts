const endpointKey = 'kos-pi-endpoint'
let cleanup: Promise<void> = Promise.resolve()

export function rememberPiEndpoint(url: string) {
  try {
    sessionStorage.setItem(endpointKey, url)
  } catch {
    return
  }
}

export function clearPiSession() {
  cleanup = cleanup
    .then(async () => {
      let url: string | null = null
      try {
        url = sessionStorage.getItem(endpointKey)
      } catch {
        return
      }
      if (!url) return
      const { createWispChat } = await import('@southneuhof/wisp-core')
      const client = createWispChat({ url })
      try {
        await client.auth.setSession(null)
      } finally {
        client.dispose()
      }
    })
    .catch(() => {})
  return cleanup
}

export function waitForPiCleanup() {
  return cleanup
}
