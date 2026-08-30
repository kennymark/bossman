import type { HttpContext } from '@adonisjs/core/http'

import TeamMember from '#models/team_member'
import { PAGE_KEYS, type PageKey } from '#utils/page_access'

const PAGE_KEYS_SET = new Set<string>(PAGE_KEYS)

/** Memoised per request so the same lookup is not repeated by middleware and controllers. */
const REQUEST_CACHE = new WeakMap<HttpContext, Promise<PageKey[] | null>>()

/**
 * Returns the allowed page keys for the user.
 *
 * - `null` means "unrestricted" (full access)
 * - `PageKey[]` means "restricted to these pages"
 */
export async function getPageAccessForUser(userId: string): Promise<PageKey[] | null> {
  const membership = await TeamMember.query().where('user_id', userId).first()

  if (!membership) return null
  if (membership.role === 'owner') return null

  const pages = membership.allowedPages ?? null
  if (!pages?.length) return null

  const set = new Set<PageKey>()
  for (const p of pages) {
    if (PAGE_KEYS_SET.has(p)) set.add(p as PageKey)
  }
  const merged = Array.from(set)
  return merged.length ? merged : null
}

/**
 * Page access for the current request's user, resolved at most once per request.
 *
 * The middleware and any controller that needs the list share this result, so gating a
 * route no longer costs a `team_members` query per call site.
 */
export function getPageAccessForRequest(ctx: HttpContext): Promise<PageKey[] | null> {
  const cached = REQUEST_CACHE.get(ctx)
  if (cached) return cached

  const userId = ctx.auth?.user?.id
  const pending = userId ? getPageAccessForUser(userId) : Promise.resolve(null)
  REQUEST_CACHE.set(ctx, pending)
  return pending
}

/** True when the user may reach `page`. Unrestricted users may reach every page. */
export async function canAccessPage(ctx: HttpContext, page: PageKey): Promise<boolean> {
  const allowed = await getPageAccessForRequest(ctx)
  return !allowed || allowed.includes(page)
}
