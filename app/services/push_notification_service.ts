import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type PushNotification from '#models/push_notification'
import { sendOneSignalPush } from '#services/one_signal_service'

/**
 * Resolve TogethaUser ids by target type (uses users table: landlord_id, agency_id, tenant_id).
 */
export async function resolveUserIds(
  targetType: string,
  targetUserIds: string[] | undefined,
  appEnv: string,
): Promise<string[]> {
  if (targetType === 'specific' && targetUserIds?.length) {
    return targetUserIds
  }
  const conn = db.connection(appEnv)
  const column =
    targetType === 'all_landlords'
      ? 'landlord_id'
      : targetType === 'all_tenants'
        ? 'tenant_id'
        : targetType === 'all_agencies'
          ? 'agency_id'
          : null
  if (targetType === 'all') {
    const result = await conn.rawQuery('SELECT id FROM users')
    const rows = result.rows as { id: string }[]
    return rows.map((r) => r.id)
  }
  if (column) {
    const result = await conn.rawQuery(
      `SELECT id FROM users WHERE ${column} IS NOT NULL AND ${column} != ''`,
    )
    const rows = result.rows as { id: string }[]
    return rows.map((r) => r.id)
  }
  return []
}

/**
 * Send a push notification to the given user IDs via OneSignal and update the notification record.
 * Sets status (sent/failed), sentAt, oneSignalResponse, errorMessage.
 */
export async function sendToRecipients(
  notification: PushNotification,
  userIds: string[],
): Promise<void> {
  const id = notification.id
  logger.info({ id, userIdCount: userIds.length }, 'push-notification: sending')
  try {
    const result = await sendOneSignalPush({
      externalIds: userIds,
      heading: notification.title,
      content: notification.description,
      imageUrl: notification.imageUrl ?? undefined,
      url: notification.url ?? undefined,
    })
    const success = !result.errors
    await notification
      .merge({
        status: success ? 'sent' : 'failed',
        sentAt: success ? DateTime.now() : null,
        oneSignalResponse: result as Record<string, unknown>,
        errorMessage: result.errors ? JSON.stringify(result.errors) : null,
      })
      .save()
    logger.info({ id, status: success ? 'sent' : 'failed' }, 'push-notification: done')
  } catch (err) {
    await notification
      .merge({
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .save()
    throw err
  }
}
