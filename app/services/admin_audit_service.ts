import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

import AdminAction, { type AdminActionOutcome } from '#models/admin_action'
import type { AppEnv } from '#types/env'

/**
 * Every operator action worth answering "who did this, and why?" about.
 *
 * Keys are dotted and stable; the UI groups on the prefix. Adding one here is what
 * makes it filterable on the audit page, so prefer extending this union over passing
 * a free-form string.
 */
export const ADMIN_ACTIONS = [
  'org.ban',
  'org.unban',
  'org.update',
  'org.create',
  'org.favourite',
  'org.test_account',
  'org.sales_account',
  'org.request_delete_user',
  'org.bulk_favourite',
  'org.bulk_test_account',
  'org.invoice_create',
  'backup.create',
  'backup.restore',
  'backup.restore_preview',
  'backup.delete',
  'backup.download',
  'member.update',
  'member.remove',
  'member.prod_access_grant',
  'member.prod_access_revoke',
  'invitation.create',
  'invitation.revoke',
  'push_notification.send',
  'env.switch',
  'server.deploy',
  'server.restart',
  'org.impersonate',
  'org.feature_flags_update',
  'org.feature_flags_reset',
  'job.rerun',
  'job.delete',
  'member.prod_access_mode',
  'export.csv',
] as const

export type AdminActionKey = (typeof ADMIN_ACTIONS)[number]

export interface RecordActionInput {
  action: AdminActionKey
  appEnv?: AppEnv | null
  targetType?: string | null
  targetId?: string | number | null
  targetLabel?: string | null
  reason?: string | null
  outcome?: AdminActionOutcome
  error?: string | null
  metadata?: Record<string, unknown> | null
}

/** Keys that must never be copied into an audit row's metadata. */
const REDACTED_KEYS = [
  'password',
  'token',
  'secret',
  'connectionurl',
  'connectionstring',
  'authorization',
  'cookie',
  'apikey',
  'recoverycode',
  'recoverycodes',
]

/**
 * Strips anything credential-shaped before it is persisted.
 *
 * Metadata is assembled by call sites from request bodies, so it is one careless spread
 * away from writing a password or a connection string into a table built for reading.
 */
export function redactMetadata(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value ?? null
  if (Array.isArray(value))
    return value.slice(0, 100).map((item) => redactMetadata(item, depth + 1))
  if (typeof value !== 'object') return value

  const out: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.some((needle) => key.toLowerCase().includes(needle))
      ? '[redacted]'
      : redactMetadata(entry, depth + 1)
  }
  return out
}

/**
 * Writes one operator action to the admin database.
 *
 * Never throws: an audit write failing must not roll back or mask the action the
 * operator actually performed. A failure to record is logged at error level instead.
 */
export async function recordAdminAction(
  ctx: HttpContext,
  input: RecordActionInput,
): Promise<AdminAction | null> {
  const user = ctx.auth?.user

  try {
    return await AdminAction.create({
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
      actorRole: user?.isGodAdmin ? 'god_admin' : (user?.role ?? null),
      action: input.action,
      appEnv: input.appEnv ?? safeAppEnv(ctx),
      targetType: input.targetType ?? null,
      targetId:
        input.targetId === null || input.targetId === undefined ? null : String(input.targetId),
      targetLabel: input.targetLabel ?? null,
      reason: input.reason?.trim() || null,
      outcome: input.outcome ?? 'success',
      error: input.error?.slice(0, 2000) ?? null,
      metadata: (redactMetadata(input.metadata ?? null) as Record<string, unknown>) ?? null,
      ipAddress: safeIp(ctx),
      userAgent: ctx.request?.header('user-agent')?.slice(0, 500) ?? null,
    })
  } catch (err) {
    logger.error({ err, action: input.action }, 'Could not record admin action')
    return null
  }
}

function safeAppEnv(ctx: HttpContext): AppEnv | null {
  try {
    return ctx.request.appEnv()
  } catch {
    return null
  }
}

function safeIp(ctx: HttpContext): string | null {
  try {
    return ctx.request.ip() ?? null
  } catch {
    return null
  }
}
