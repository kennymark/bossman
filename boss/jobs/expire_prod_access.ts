import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

import { worker } from '#boss/base'
import TeamMember from '#models/team_member'
import User from '#models/user'
import { NotificationService } from '#services/notification_service'

/**
 * Revokes production access once its grant has lapsed.
 *
 * `resolveAppEnv` already refuses to hand out `prod` for an expired grant, so this is
 * belt and braces rather than the control itself — but it means the flag on the record
 * matches reality, so the team page does not show access that is no longer in effect.
 */
export const expireProdAccess = worker
  .createJob('expire-prod-access')
  .input(vine.object({}))
  .retry({ limit: 3, delay: 300, backoff: true })

expireProdAccess.work(async () => {
  const now = DateTime.now()

  const expired = await User.query()
    .where('enableProdAccess', true)
    .where('isGodAdmin', false)
    .whereNotNull('prodAccessExpiresAt')
    .where('prodAccessExpiresAt', '<=', now.toSQL()!)

  if (!expired.length) return

  const notifications = new NotificationService()

  for (const user of expired) {
    user.merge({
      enableProdAccess: false,
      prodAccessExpiresAt: null,
      prodAccessReason: null,
      prodAccessGrantedBy: null,
      prodAccessGrantedAt: null,
    })
    await user.save()

    await TeamMember.query()
      .where('userId', user.id)
      .update({ enable_prod_access: false, prod_access_expires_at: null })

    await notifications
      .push({
        userId: user.id,
        title: 'Production access expired',
        message:
          'Your production database access has lapsed and you are back on the development database. Ask a god admin if you still need it.',
        type: 'warning',
      })
      .catch((err) => logger.error({ err, userId: user.id }, 'Could not notify on prod expiry'))
  }

  logger.info({ count: expired.length }, 'Expired production access grants')
})
