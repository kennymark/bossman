import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Notification from '#models/notification'
import notificationService from '#services/notification_service'

const markAsReadValidator = vine.compile(
  vine.object({
    notificationId: vine.string(),
  }),
)

export default class NotificationsController {
  async index({ auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const page = Number(request.qs().page) || 1
    const perPage = Number(request.qs().perPage) || 20

    const notifications = await Notification.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

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
