import { assertRouteEntitiesBound, bindRouteEntities } from '@southneuhof/sprindle/hono'
import manifest from './.sprindle-vercel/routes.mjs'
import { createApp } from './src/create-app.ts'
import { getDomainSchema } from './src/db.ts'

const apiManifest = manifest.map((route) => ({
  ...route,
  httpPath: route.httpPath === '/api' || route.httpPath.startsWith('/api/') ? route.httpPath : `/api${route.httpPath}`,
}))

bindRouteEntities(apiManifest, getDomainSchema().entities)
assertRouteEntitiesBound(apiManifest)

export default createApp(apiManifest)
