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
  'maintenance',
  'documents',
  'jobs',
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
  maintenance: '/maintenance',
  documents: '/documents',
  jobs: '/jobs',
}

/**
 * Path prefixes that require a page grant, most specific first.
 *
 * Both the Inertia page path and the JSON path that backs it map to the same key, so
 * gating the API group with `pageAccess` enforces exactly the same rule as the page
 * itself. Without this, a member restricted to one page could still call the JSON
 * endpoints behind every other page.
 */
const PATH_RULES: ReadonlyArray<readonly [string, PageKey]> = [
  ['/analytics', 'analytics'],
  ['/dashboard', 'dashboard'],
  ['/teams', 'teams'],
  ['/members', 'teams'],
  ['/invitations', 'teams'],
  ['/blog/manage', 'blog'],
  ['/orgs', 'orgs'],
  ['/leases', 'leases'],
  ['/properties', 'properties'],
  ['/leaseable-entities', 'properties'],
  ['/push-notifications', 'pushNotifications'],
  ['/db-backups', 'dbBackups'],
  ['/logs', 'logs'],
  ['/emails', 'emails'],
  ['/servers', 'servers'],
  ['/railway', 'servers'],
  ['/addons', 'addons'],
  ['/api-access', 'apiAccess'],
  ['/maintenance', 'maintenance'],
  ['/documents', 'documents'],
  ['/jobs', 'jobs'],
]

/** Strips a trailing slash and any `/api/v1` prefix so one rule table covers both. */
function normalisePath(pathname: string): string {
  const path = `/${String(pathname || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')}`

  return path.replace(/^\/api\/v\d+/, '') || '/'
}

/**
 * The page grant a path requires, or `null` when the path is not page-gated.
 *
 * `null` covers routes every signed-in admin may reach regardless of their page
 * grants — their own settings, notifications, their own audit trail, and the
 * environment switcher.
 */
export function requiredPageKeyForPath(pathname: string): PageKey | null {
  const path = normalisePath(pathname)

  for (const [prefix, key] of PATH_RULES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return key
  }

  return null
}
