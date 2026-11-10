import type { AppRouteName, StaticAppRouteName } from '@/router/route-names'

export type NavigationIcon =
  | 'home'
  | 'folder'
  | 'inbox'
  | 'database-2'
  | 'briefcase-4'
  | 'settings'
  | 'door-open'
  | 'hotel'
  | 'price-tag-3'
  | 'calendar-event'
  | 'wallet-3'
  | 'repeat'
  | 'user-3'
  | 'shield-user'
  | 'key-2'
export type NavigationSeparator = { separator: string }
type NavigationSearch = { aliases?: readonly string[] }
export type NavigationAction = NavigationSearch & { action: { permission: string | null; to?: { name: AppRouteName; params?: Record<string, string> } }; title: string; icon: NavigationIcon }
export type NavigationDirect = NavigationSearch & { to: { name: StaticAppRouteName }; permission: string | null; title: string; icon: NavigationIcon }
export type NavigationEntry = NavigationSeparator | NavigationAction | NavigationDirect
export type NavigationModule = {
  name: string
  title: string
  icon: NavigationIcon
  description?: string
} & ({ kind: 'module' | 'group'; routes: readonly NavigationEntry[] } | { kind: 'standalone'; routes: readonly [NavigationDirect] })
export function defineNavigation<const TNavigation extends readonly NavigationModule[]>(navigation: TNavigation): TNavigation {
  return navigation
}
