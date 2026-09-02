import type { HttpContext } from '@adonisjs/core/http'

import TeamMember from '#models/team_member'
import { canAccessProd } from '#services/app_env_service'
import { effectiveProdAccessMode, type ProdAccessMode } from '#utils/prod_access'

/** Memoised per request: the read-only middleware and Inertia both need the row. */
const REQUEST_CACHE = new WeakMap<HttpContext, Promise<TeamMember | null>>()

/** The current user's team member row, looked up at most once per request. */
export function getTeamMemberForRequest(ctx: HttpContext): Promise<TeamMember | null> {
  const cached = REQUEST_CACHE.get(ctx)
  if (cached) return cached

  const userId = ctx.auth?.user?.id
  const pending = userId
    ? TeamMember.query().where('user_id', userId).first()
    : Promise.resolve(null)
  REQUEST_CACHE.set(ctx, pending)
  return pending
}

/**
 * The production access mode in force for the request's user.
 *
 * `null` means the user cannot reach production at all, so the mode is moot. A god
 * admin is always `write`; nobody else needs a query unless they hold a live grant.
 */
export async function getProdAccessModeForRequest(
  ctx: HttpContext,
): Promise<ProdAccessMode | null> {
  const user = ctx.auth?.user
  if (!user || !canAccessProd(user)) return null
  if (user.isGodAdmin) return 'write'
  return effectiveProdAccessMode(user, await getTeamMemberForRequest(ctx))
}
