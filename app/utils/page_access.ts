export const PAGE_KEYS = [
  'analytics',
  'dashboard',
  'teams',
  'blog',
  'orgs',
  'leases',
  'properties',
  'pushNotifications',
  'dbBackups',
  'logs',
  'emails',
  'servers',
  'addons',
  'apiAccess',
] as const

export type PageKey = (typeof PAGE_KEYS)[number]

export const PAGE_KEY_TO_PATH: Record<PageKey, string> = {
  analytics: '/analytics',
  dashboard: '/dashboard',
  teams: '/teams',
  blog: '/blog/manage',
  orgs: '/orgs',
  leases: '/leases',
  properties: '/properties',
  pushNotifications: '/push-notifications',
  dbBackups: '/db-backups',
  logs: '/logs',
  emails: '/emails',
  servers: '/servers',
  addons: '/addons',
  apiAccess: '/api-access',
}

export function requiredPageKeyForPath(pathname: string): PageKey {
  const path = `/${String(pathname || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')}`

  if (path === '/analytics') return 'analytics'
  if (path === '/dashboard') return 'dashboard'
  if (path.startsWith('/teams')) return 'teams'
  if (path.startsWith('/blog/manage')) return 'blog'
  if (path.startsWith('/orgs')) return 'orgs'
  if (path.startsWith('/leases')) return 'leases'
  if (path.startsWith('/properties')) return 'properties'
  if (path.startsWith('/push-notifications')) return 'pushNotifications'
  if (path.startsWith('/db-backups')) return 'dbBackups'
  if (path.startsWith('/logs')) return 'logs'
  if (path.startsWith('/emails')) return 'emails'
  if (path.startsWith('/servers')) return 'servers'
  if (path.startsWith('/addons')) return 'addons'
  if (path.startsWith('/api-access')) return 'apiAccess'

  return 'dashboard'
}
