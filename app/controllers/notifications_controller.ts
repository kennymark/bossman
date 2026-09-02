import type { HttpContext } from '@adonisjs/core/http'

import Notification from '#models/notification'
import notificationService from '#services/notification_service'
import { markAsReadValidator } from '#validators/notification'
import { paginationQueryValidator } from '#validators/query'

export default class NotificationsController {
  async index({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    await request.validateUsing(paginationQueryValidator)
    const params = await request.paginationQs()
    const notifications = await Notification.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'desc')
      .sortBy(params.sortBy || 'createdAt', params.sortOrder || 'desc')
      .paginate(params.page || 1, params.perPage || 20)

    const unreadCount = await notificationService.getUnreadCount(user.id)

    return {
      notifications,
      unreadCount,
    }
  }

  async markAsRead({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { notificationId } = await request.validateUsing(markAsReadValidator)

    await notificationService.markAsRead(notificationId, user.id)

    return response.ok({ message: 'Notification marked as read' })
  }

  async markAllAsRead({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    await notificationService.markAllAsRead(user.id)

    return response.ok({ message: 'All notifications marked as read' })
  }

  async delete({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    await notificationService.delete(params.id, user.id)

    return response.ok({ message: 'Notification deleted' })
  }

  async unreadCount({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const count = await notificationService.getUnreadCount(user.id)

    return response.ok({ count })
  }
}
