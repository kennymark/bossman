/**
 * Send pending push notifications that are due (scheduled_at <= now).
 * Run via cron every minute for scheduled sends, e.g.:
 *   * * * * * cd /path/to/app && node ace push:send-scheduled
 */
import { BaseCommand } from '@adonisjs/core/ace'
import PushNotification from '#models/push_notification'
import {
  resolveUserIds,
  sendToRecipients,
} from '#services/push_notification_service'

export default class SendScheduledPushNotifications extends BaseCommand {
  static commandName = 'push:send-scheduled'
  static description =
    'Send pending push notifications that are due (scheduled_at <= now)'

  static options = {
    startApp: true,
  }

  async run() {
    const appEnv = this.app.env.get('NODE_ENV') === 'production' ? 'prod' : 'dev'
    const now = new Date().toISOString()
    const pending = await PushNotification.query({ connection: appEnv })
      .where('status', 'pending')
      .whereNotNull('scheduled_at')
      .where('scheduled_at', '<=', now)
      .orderBy('scheduled_at', 'asc')
      .limit(50)

    if (pending.length === 0) {
      this.logger.info('No scheduled push notifications due.')
      return
    }

    this.logger.info(`Sending ${pending.length} scheduled push notification(s).`)

    for (const notification of pending) {
      try {
        const userIds = await resolveUserIds(
          notification.targetType,
          notification.targetUserIds ?? undefined,
          appEnv,
        )
        if (userIds.length === 0) {
          await notification
            .merge({ status: 'failed', errorMessage: 'No recipients' })
            .save()
          continue
        }
        await sendToRecipients(notification, userIds)
        this.logger.info(`Notification ${notification.id}: sent`)
      } catch {
        // Service already updated notification status and errorMessage
        this.logger.error(`Notification ${notification.id}: failed`)
      }
    }
  }
}
