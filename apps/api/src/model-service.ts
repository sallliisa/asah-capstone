export async function modelRequest(path: string, body?: unknown) {
  if (!process.env.MODEL_SERVICE_URL || !process.env.MODEL_SERVICE_TOKEN) throw new Error('model_service_unconfigured')
  const response = await fetch(`${process.env.MODEL_SERVICE_URL.replace(/\/$/, '')}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: `Bearer ${process.env.MODEL_SERVICE_TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error('model_service_unavailable')
  return response.json()
}
