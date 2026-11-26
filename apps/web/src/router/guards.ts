import { identityStatus, loadIdentity } from '@/framework/identity'
import { savePostLoginRedirect } from '@/utils/post-login-redirect'
import { getDefaultAuthenticatedRouteLocation } from './navigation'
import { evaluateResourceRouteAccess, useResourceRuntime, type AccessAdapter } from '@southneuhof/loom'
import type { NavigationGuard } from 'vue-router'
import { toast } from 'vue-sonner'

function allowsExtraordinaryRoute(meta: { permission?: string }, access: AccessAdapter): boolean {
  return !meta.permission || access.allows({ operation: 'detail', permission: meta.permission })
}

/** Enforces ordinary route permission metadata on direct URL entry. */
export function createPermissionGuard(access?: AccessAdapter): NavigationGuard {
  return (to, from) => {
    if (!access && identityStatus.value === 'failed') return true
    const adapter = access ?? useResourceRuntime().adapters.access
    const routeAccess = typeof to.name === 'string' ? evaluateResourceRouteAccess(to.name, adapter) : undefined
    const allowed = routeAccess ?? allowsExtraordinaryRoute(to.meta, adapter)
    if (allowed) return true
    if (from.matched?.length && from.name !== 'auth-login') {
      toast.error('You do not have access to this page.')
      return false
    }
    return { path: '/access-denied', replace: true }
  }
}

export function createAuthGuard(): NavigationGuard {
  return async (to) => {
    const needsIdentity = to.path === '/' || to.name === 'auth-login' || Boolean(to.meta.requiresAuth)
    if (!needsIdentity) return true

    let authenticated = false
    try {
      authenticated = Boolean(await loadIdentity())
    } catch (_) {
      // Keep the current route when the server is unavailable. Do not turn a
      // valid server session into an anonymous browser state.
      return true
    }

    if (to.path === '/') {
      if (!authenticated) return { name: 'auth-login' } as never
      return getDefaultAuthenticatedRouteLocation() ?? true
    }

    if (authenticated && to.name === 'auth-login') {
      return getDefaultAuthenticatedRouteLocation() ?? true
    }

    if (to.meta.requiresAuth && !authenticated) {
      savePostLoginRedirect(to.fullPath)
      return { name: 'auth-login' } as never
    }

    return true
  }
}
