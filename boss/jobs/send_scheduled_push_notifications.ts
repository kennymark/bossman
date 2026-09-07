import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'

import { worker } from '#boss/base'
import PushNotification from '#models/push_notification'
import { resolveUserIds, sendToRecipients } from '#services/push_notification_service'
import type { AppEnv } from '#types/env'

/**
 * Picks up due scheduled OneSignal pushes every minute.
 *
 * Rows live on ADMIN_DB; audience is resolved from the `appEnv` stored on each
 * notification when it was created.
 */
export const sendScheduledPushNotifications = worker
  .createJob('send-scheduled-push-notifications')
  .input(vine.object({}))
  .retry({ limit: 2, delay: 30, backoff: true })

sendScheduledPushNotifications.work(async () => {
  const now = new Date().toISOString()
  const pending = await PushNotification.query()
    .where('status', 'pending')
    .whereNotNull('scheduled_at')
    .where('scheduled_at', '<=', now)
    .orderBy('scheduled_at', 'asc')
    .limit(50)

  if (!pending.length) return

  logger.info({ count: pending.length }, 'Sending scheduled push notifications')

  for (const notification of pending) {
    try {
      const appEnv = (notification.appEnv ?? 'dev') as AppEnv
      const userIds = await resolveUserIds(
        notification.targetType,
        notification.targetUserIds ?? undefined,
        appEnv,
      )
      if (userIds.length === 0) {
        await notification.merge({ status: 'failed', errorMessage: 'No recipients' }).save()
        continue
      }
      await sendToRecipients(notification, userIds)
    } catch (err) {
      logger.error({ err, id: notification.id }, 'Scheduled push notification failed')
    }
  }
})
