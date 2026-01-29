export const ADMIN_PAGE_KEYS = [
  'admin_dashboard',
  'admin_users',
  'admin_blog',
  'admin_teams',
] as const

export type AdminPageKey = (typeof ADMIN_PAGE_KEYS)[number]

export const ADMIN_PAGE_KEY_TO_PATH: Record<AdminPageKey, string> = {
  admin_dashboard: '/dashboard',
  admin_users: '/users',
  admin_blog: '/blog/manage',
  admin_teams: '/teams',
}

export function requiredAdminPageKeyForPath(pathname: string): AdminPageKey {
  const path = `/${String(pathname || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')}`

  if (path === '/dashboard') return 'admin_dashboard'
  if (path.startsWith('/users')) return 'admin_users'
  if (path.startsWith('/teams')) return 'admin_teams'
  if (path.startsWith('/blog/manage')) return 'admin_blog'

  return 'admin_dashboard'
}
