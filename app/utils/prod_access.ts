import { type PageKey, requiredPageKeyForPath } from '#utils/page_access'

/**
 * Read-only production access.
 *
 * Client-safe: pure logic with no AdonisJS imports, so pages can hide write actions
 * using the same rule the middleware enforces. See `agent.md` item 1.
 */

export const PROD_ACCESS_MODES = ['read', 'write'] as const
export type ProdAccessMode = (typeof PROD_ACCESS_MODES)[number]

/** The message a read-only member sees when a production write is refused. */
export const PROD_READ_ONLY_ERROR = 'Your production access is read-only.'

/**
 * Page keys whose mutating endpoints touch customer data.
 *
 * Everything else — teams, blog, emails, servers, addons, logs, API access, and the
 * ungated personal routes — lives in the admin database or in third-party services,
 * so a read-only production grant does not restrict it.
 */
export const PROD_WRITE_GATED_KEYS: readonly PageKey[] = [
  'orgs',
  'leases',
  'properties',
  'maintenance',
  'documents',
  'pushNotifications',
  'dashboard',
  'analytics',
  'jobs',
  'dbBackups',
]

const GATED = new Set<PageKey>(PROD_WRITE_GATED_KEYS)

/** HTTP methods that change state. Anything else is a read and never blocked. */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Structural shapes so this stays usable from the browser and from middleware alike. */
export interface ProdModeUser {
  isGodAdmin: boolean
  prodAccessMode?: ProdAccessMode | string | null
}

export interface ProdModeMember {
  prodAccessMode?: ProdAccessMode | string | null
}

function normaliseMode(value: unknown): ProdAccessMode {
  return value === 'read' ? 'read' : 'write'
}

/**
 * The mode actually in force: the stricter of the user's and the team member's.
 *
 * A god admin is always `write`. An unknown or missing value counts as `write`, which
 * is what every record held before the column existed.
 */
export function effectiveProdAccessMode(
  user: ProdModeUser | null | undefined,
  member?: ProdModeMember | null,
): ProdAccessMode {
  if (!user) return 'write'
  if (user.isGodAdmin) return 'write'
  const userMode = normaliseMode(user.prodAccessMode)
  const memberMode = member ? normaliseMode(member.prodAccessMode) : 'write'
  return userMode === 'read' || memberMode === 'read' ? 'read' : 'write'
}

export function isProdWriteGatedKey(key: PageKey | null): boolean {
  return key !== null && GATED.has(key)
}

export interface ProdWriteCheck {
  method: string
  path: string
  appEnv: string
  user: ProdModeUser | null | undefined
  member?: ProdModeMember | null
}

/**
 * Whether a request must be refused because the caller's production access is
 * read-only.
 *
 * Blocks only when every condition holds: the method mutates, the request resolves to
 * production, the path belongs to a customer-data page, and the effective mode is
 * `read`. Reads, the dev database, admin-only pages and god admins are never blocked —
 * this narrows an existing grant, it never widens one.
 */
export function isProdWriteBlocked({
  method,
  path,
  appEnv,
  user,
  member,
}: ProdWriteCheck): boolean {
  if (!user) return false
  if (!MUTATING_METHODS.has(String(method).toUpperCase())) return false
  if (appEnv !== 'prod') return false
  if (effectiveProdAccessMode(user, member) !== 'read') return false

  const pathname = String(path).split('?')[0]?.split('#')[0] || '/'
  return isProdWriteGatedKey(requiredPageKeyForPath(pathname))
}
