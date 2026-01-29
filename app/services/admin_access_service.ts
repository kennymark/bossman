import TeamMember from '#models/team_member'
import type { AdminPageKey } from '#utils/admin_pages'

/**
 * Returns the allowed admin page keys for an admin user.
 *
 * - `null` means "unrestricted" (full admin access)
 * - `AdminPageKey[]` means "restricted to these pages"
 */
export async function getAdminPageAccessForUser(userId: string): Promise<AdminPageKey[] | null> {
  const memberships = await TeamMember.query()
    .where('user_id', userId)
    .whereHas('team', (q) => q.where('kind', 'admin'))

  if (!memberships.length) return null
  if (memberships.some((m) => m.role === 'owner')) return null

  const set = new Set<AdminPageKey>()
  for (const m of memberships) {
    const pages = m.adminPages ?? null
    if (!pages?.length) continue
    for (const p of pages) set.add(p as AdminPageKey)
  }

  const merged = Array.from(set)
  return merged.length ? merged : null
}

