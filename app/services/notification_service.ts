import logger from '@adonisjs/core/services/logger'
import transmit from '@adonisjs/transmit/services/main'
import { DateTime } from 'luxon'
import Notification, { type NotificationAction } from '#models/notification'

export interface PushNotificationOptions {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  actions?: NotificationAction[]
  data?: Record<string, unknown>
}

export class NotificationService {
  /**
   * Push a notification to a user
   */
  async push(options: PushNotificationOptions): Promise<Notification> {
    const { userId, title, message, type = 'info', actions, data } = options

    // Create notification in database
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      actions: actions || null,
      data: data || null,
      read: false,
    })

    // Broadcast via Transmit
    transmit.broadcast(`notification:${userId}`, {
      type: 'notification',
      notification: notification.serialize(),
    })
    logger.info(`Notification created: ${notification.title}`)

    return notification
  }

  /**
   * Push notifications to multiple users
   */
  async pushMany(
    userIds: string[],
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actions?: NotificationAction[],
    data?: Record<string, unknown>,
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.push({
          userId,
          title,
          message,
          type,
          actions,
          data,
        }),
      ),
    )

    return notifications
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await Notification.findOrFail(notificationId)

    if (notification.userId !== userId) {
      throw new Error('Unauthorized')
    }

    notification.read = true
    notification.readAt = DateTime.now()
    await notification.save()

    // Broadcast update
    transmit.broadcast(`notification:${userId}`, {
      type: 'notification:read',
      notificationId: notification.id,
    })
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.query().where('user_id', userId).where('read', false).update({
      read: true,
      read_at: DateTime.now().toSQL(),
    })

    // Broadcast update
    transmit.broadcast(`notification:${userId}`, {
      type: 'notifications:all_read',
    })
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await Notification.findOrFail(notificationId)

    if (notification.userId !== userId) {
      throw new Error('Unauthorized')
    }

    await notification.delete()

    // Broadcast deletion
    transmit.broadcast(`notification:${userId}`, {
      type: 'notification:deleted',
      notificationId: notification.id,
    })
    logger.info(`Notification deleted: ${notification.title}`)
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await Notification.query()
      .where('user_id', userId)
      .where('read', false)
      .count('* as total')
      .first()
    logger.info(`Unread count for user ${userId}: ${result?.$extras?.total}`)
    return Number((result?.$extras?.total as number) || 0)
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Notification[]> {
    return Notification.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
  }
}

export default new NotificationService()
