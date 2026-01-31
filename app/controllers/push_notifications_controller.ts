import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

import PushNotification from '#models/push_notification'
import TogethaUser from '#models/togetha_user'
import { sendOneSignalPush } from '#services/one_signal_service'
import { storePushNotificationValidator } from '#validators/push_notification'

export default class PushNotificationsController {
  async users({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    const search = request.qs().search as string | undefined
    const users = TogethaUser.query({ connection: appEnv })
      .select('id', 'name', 'email', 'landlordId', 'agencyId', 'tenantId')
      .orderBy('name', 'asc')
      .if(search, (q) => q.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`))
      .limit(200)

    return response.ok(users)
  }

  async index({ request, inertia }: HttpContext) {
    const params = await request.paginationQs()
    const notifications = await PushNotification.query()
      .orderBy('created_at', 'desc')
      .paginate(params.page ?? 1, params.perPage ?? 20)

    return inertia.render('push-notifications/index', { notifications })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('push-notifications/create')
  }

  /**
   * Resolve TogethaUser ids by target type (uses users table: landlord_id, agency_id, tenant_id).
   */
  async resolveUserIds(
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

  async resend({ request, response, now }: HttpContext) {
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
    const appEnv = request.appEnv()
    const userIds = await this.resolveUserIds(
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
      logger.info({ id, userIdCount: userIds.length }, 'push-notifications/resend: sending')
      const result = await sendOneSignalPush({
        externalIds: userIds,
        heading: notification.title,
        content: notification.description,
        imageUrl: notification.imageUrl ?? undefined,
        url: notification.url ?? undefined,
      })
      await notification
        .merge({
          status: result.errors ? 'failed' : 'sent',
          sentAt: result.errors ? null : now,
          oneSignalResponse: result as Record<string, unknown>,
          errorMessage: result.errors ? JSON.stringify(result.errors) : null,
        })
        .save()
      logger.info(
        { id, status: result.errors ? 'failed' : 'sent' },
        'push-notifications/resend: done',
      )
    } catch (err) {
      logger.error({ id, err }, 'push-notifications/resend: error')
      console.log('error resending push notification', err)
      await notification
        .merge({
          errorMessage: err instanceof Error ? err.message : String(err),
        })
        .save()
    }
    return response.redirect().back()
  }

  async store({ request, response, now }: HttpContext) {
    const appEnv = request.appEnv()
    const payload = await request.validateUsing(storePushNotificationValidator)

    if (payload.targetType === 'specific' && !payload.targetUserIds?.length) {
      return response.badRequest({ errors: { targetUserIds: ['Select at least one user'] } })
    }
    try {
      const userIds = await this.resolveUserIds(payload.targetType, payload.targetUserIds, appEnv)
      const sendNow = !payload.sendAt

      const notification = await PushNotification.create({
        targetType: payload.targetType as PushNotification['targetType'],
        targetUserIds: payload.targetUserIds ?? null,
        title: payload.title,
        description: payload.description,
        imageUrl: payload.imageUrl ?? null,
        url: payload.url ?? null,
        scheduledAt: payload.sendAt,
        sentAt: null,
        status: 'pending',
      })

      if (sendNow && userIds.length > 0) {
        try {
          const result = await sendOneSignalPush({
            externalIds: userIds,
            heading: payload.title,
            content: payload.description,
            imageUrl: payload.imageUrl,
            url: payload.url,
          })
          await notification
            .merge({
              status: result.errors ? 'failed' : 'sent',
              sentAt: result.errors ? null : now,
              oneSignalResponse: result as Record<string, unknown>,
              errorMessage: result.errors ? JSON.stringify(result.errors) : null,
            })
            .save()
        } catch (err) {
          console.log('error sending push notification', err)
          await notification.merge({ status: 'failed', errorMessage: err.message }).save()
        }
      }
      return response.redirect('/push-notifications')
    } catch (err) {
      console.log(err)
      return response.badRequest({ error: err.message })
    }
  }
}
