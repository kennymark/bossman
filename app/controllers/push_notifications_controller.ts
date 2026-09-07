import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

import PushNotification from '#models/push_notification'
import TogethaUser from '#models/togetha_user'
import { resolveUserIds, sendToRecipients } from '#services/push_notification_service'
import PushNotificationTransformer from '#transformers/push_notification_transformer'
import { paginatedIndex } from '#utils/paginated_index'
import { storePushNotificationValidator } from '#validators/push_notification'
import { pushNotificationUsersValidator } from '#validators/query'

export default class PushNotificationsController {
  async users({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    await request.validateUsing(pushNotificationUsersValidator)
    const search = request.qs().search as string | undefined
    const users = await TogethaUser.query({ connection: appEnv })
      .select('id', 'name', 'email', 'landlordId', 'agencyId', 'tenantId')
      .orderBy('name', 'asc')
      .if(search, (q) => q.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`))
      .limit(200)

    return response.ok(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
      })),
    )
  }

  async index({ request, inertia }: HttpContext) {
    const pageProps = await paginatedIndex(
      request,
      inertia,
      'notifications',
      (page, perPage) =>
        PushNotification.query().orderBy('created_at', 'desc').paginate(page, perPage),
      PushNotificationTransformer,
      { defaultPerPage: 20 },
    )
    return inertia.render('push-notifications/index', pageProps)
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('push-notifications/create', {})
  }

  async resend({ request, response }: HttpContext) {
    const id = request.param('id')
    logger.info({ id }, 'push-notifications/resend: start')
    const notification = await PushNotification.find(id)
    if (!notification) {
      logger.warn({ id }, 'push-notifications/resend: notification not found')
      return response.notFound()
    }
    if (notification.status !== 'failed') {
      logger.warn({ id, status: notification.status }, 'push-notifications/resend: not failed')
      return response.badRequest({ error: 'Only failed notifications can be resent.' })
    }
    const appEnv = notification.appEnv ?? request.appEnv()
    const userIds = await resolveUserIds(
      notification.targetType,
      notification.targetUserIds ?? undefined,
      appEnv,
    )
    if (userIds.length === 0) {
      logger.warn({ id }, 'push-notifications/resend: no recipients')
      await notification.merge({ errorMessage: 'No recipients' }).save()
      return response.redirect().back()
    }
    try {
      await sendToRecipients(notification, userIds)
    } catch {
      // Service already updated notification status and errorMessage
    }
    return response.redirect().back()
  }

  async store({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const payload = await request.validateUsing(storePushNotificationValidator)

    if (payload.targetType === 'specific' && !payload.targetUserIds?.length) {
      return response.badRequest({ errors: { targetUserIds: ['Select at least one user'] } })
    }
    try {
      const userIds = await resolveUserIds(payload.targetType, payload.targetUserIds, appEnv)
      const sendNow = !payload.sendAt

      const notification = await PushNotification.create({
        targetType: payload.targetType as PushNotification['targetType'],
        appEnv,
        targetUserIds: payload.targetUserIds ?? null,
        title: payload.title,
        description: payload.description,
        imageUrl: payload.imageUrl ?? null,
        url: payload.url ?? null,
        scheduledAt: payload.sendAt ? DateTime.fromISO(payload.sendAt) : null,
        sentAt: null,
        status: 'pending',
      })

      if (sendNow) {
        if (userIds.length === 0) {
          await notification
            .merge({ status: 'failed', errorMessage: 'No recipients matched the audience.' })
            .save()
        } else {
          try {
            await sendToRecipients(notification, userIds)
          } catch {
            // Service already updated notification status and errorMessage
          }
        }
      }
      return response.redirect('/push-notifications')
    } catch (err) {
      logger.error({ err }, 'push-notifications/store: error')
      return response.badRequest({ error: err instanceof Error ? err.message : String(err) })
    }
  }
}
