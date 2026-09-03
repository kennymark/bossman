import type Org from '#models/org'
import TogethaUser from '#models/togetha_user'
import env from '#start/env'
import type { AppEnv } from '#types/env'

/** Where each Togetha environment is served when the URL is not configured. */
const DEFAULT_TOGETHA_URLS: Record<AppEnv, string> = {
  dev: 'https://dev.togetha.co.uk',
  prod: 'https://app.togetha.co.uk',
}

/** Enough for any org's team; keeps a mis-scoped query from listing the whole table. */
const MAX_TARGETS = 200

/** The fields the impersonation dialog needs, and nothing else from the user row. */
export interface ImpersonationTarget {
  id: string
  name: string | null
  email: string
  role: string | null
  lastLoginAt: string | null
  isOwner: boolean
}

export function impersonationSecret(): string | undefined {
  return env.get('IMPERSONATION_SECRET') || undefined
}

export function togethaAppUrl(appEnv: AppEnv): string {
  const configured = appEnv === 'prod' ? env.get('TOGETHA_PROD_URL') : env.get('TOGETHA_DEV_URL')
  return (configured || DEFAULT_TOGETHA_URLS[appEnv]).replace(/\/+$/, '')
}

/**
 * Users an operator may sign in as for an org: the owner (`orgs.creator_email`) and
 * everyone whose primary org is this one. Togetha's `users` table has no `org_id`
 * column — membership lives in `metadata.firstOrgId` — hence the bound JSON lookup.
 */
function targetQuery(org: Org, connection: AppEnv) {
  return TogethaUser.query({ connection }).where((query) => {
    query.whereRaw("metadata->>'firstOrgId' = ?", [org.id])
    if (org.creatorEmail) query.orWhere('email', org.creatorEmail.toLowerCase())
  })
}

export function toImpersonationTarget(user: TogethaUser, org: Org): ImpersonationTarget {
  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email,
    role: user.role ?? null,
    lastLoginAt: user.lastLoginAt?.toISO() ?? null,
    /**
     * Compared with both sides folded: only the org side used to be lowercased, so an
     * owner stored as `Name@example.com` did not match their own org and the dialog
     * offered no owner to open on.
     */
    isOwner:
      !!org.creatorEmail && user.email?.toLowerCase() === org.creatorEmail.trim().toLowerCase(),
  }
}

export async function listImpersonationTargets(
  org: Org,
  connection: AppEnv,
): Promise<ImpersonationTarget[]> {
  const users = await targetQuery(org, connection)
    .select('id', 'name', 'email', 'role', 'last_login_at', 'metadata')
    .orderBy('email', 'asc')
    .limit(MAX_TARGETS)

  /**
   * Owner first. The dialog is reached from one customer's page and opens on the first
   * target, which should be the customer themselves rather than whoever sorts first
   * alphabetically among their tenants and team members.
   */
  return users
    .map((user) => toImpersonationTarget(user, org))
    .sort((a, b) => Number(b.isOwner) - Number(a.isOwner))
}

/** Null when the user does not exist *in this org* — the caller treats both alike. */
export async function findImpersonationTarget(
  org: Org,
  userId: string,
  connection: AppEnv,
): Promise<TogethaUser | null> {
  return targetQuery(org, connection).where('id', userId).first()
}
