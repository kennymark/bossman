import env from '#start/env'

type StatsUser = {
  isGodAdmin?: boolean
  role?: string
} | null

/**
 * Who may hit `/admin/api/server-stats`, the debug APIs, and the Transmit channels.
 *
 * God admins always. Outside production, any signed-in admin can use the toolbar —
 * the seed user is `super_admin` without `isGodAdmin`, and denying them made every
 * local poll return 403. Production stays god-admin-only: the dashboard can surface
 * SQL, email bodies, and config.
 */
export function canAccessServerStats(user: StatsUser): boolean {
  if (!user) return false
  if (user.isGodAdmin) return true
  if (env.get('NODE_ENV') === 'production') return false
  return user.role === 'admin' || user.role === 'super_admin'
}
