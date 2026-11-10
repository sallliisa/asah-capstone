import { createRpcClient } from '@southneuhof/sdk'

export const apiUrl = window.location.origin

export function apiRequestUrl(input: string | URL) {
  const url = new URL(input, apiUrl)
  if (url.origin === apiUrl && url.pathname !== '/api' && !url.pathname.startsWith('/api/')) url.pathname = `/api${url.pathname}`
  return url
}

export const rpc = createRpcClient(apiUrl, {
  fetch: (input, init) => {
    const url = apiRequestUrl(input instanceof Request ? input.url : input.toString())
    return fetch(input instanceof Request ? new Request(url, input) : url, init)
  },
})
