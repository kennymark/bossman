import type { AppEnv } from '#types/env'

/**
 * Minimal shape of the fields that decide environment access. Declared structurally
 * (rather than importing the User model) so middleware can use this without pulling
 * the model — and therefore Lucid — into the middleware import graph.
 */
export interface EnvCapableUser {
  isGodAdmin: boolean
  enableProdAccess: boolean
}

/** God admins may read prod; so may members explicitly granted prod access. */
export function canAccessProd(user: EnvCapableUser | undefined | null): boolean {
  return Boolean(user?.isGodAdmin || user?.enableProdAccess)
}

/**
 * Only god admins may move between environments. Members granted prod access are
 * pinned to prod, and everyone else is pinned to dev.
 */
export function canSwitchEnv(user: EnvCapableUser | undefined | null): boolean {
  return Boolean(user?.isGodAdmin)
}

/**
 * The single authority on which database connection a request may use.
 *
 * `requested` is untrusted — it comes from the session, which the user can influence
 * via `PUT /api/v1/update-env`. It is only honoured for god admins; every other user
 * is pinned to the environment their record allows, so no request input can widen
 * access to production.
 */
export function resolveAppEnv(
  user: EnvCapableUser | undefined | null,
  requested?: string | null,
): AppEnv {
  if (!user) return 'dev'
  if (canSwitchEnv(user)) return requested === 'prod' ? 'prod' : 'dev'
  return user.enableProdAccess ? 'prod' : 'dev'
}
