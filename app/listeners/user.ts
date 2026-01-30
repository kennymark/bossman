import logger from '@adonisjs/core/services/logger'
import type { EventsList } from '@adonisjs/core/types'
import db from '@adonisjs/lucid/services/db'
import mailer from '#services/email_service'
import StripeService from '#services/stripe_service'
import env from '#start/env'

export default class UserListener {
  public async userCreated({ user, token }: EventsList['user:created']) {
    // console.log(user)
    const appUrl = env.get('APP_URL')
    const verificationUrl = `${appUrl}/verify-email?token=${token}`
    await mailer.send({
      type: 'welcome',
      data: { email: user.email, fullName: user.fullName as string },
    })
    // Send verification email
    await mailer.send({
      type: 'verify-email',
      data: { email: user.email, fullName: user.fullName || 'User', url: verificationUrl },
    })
  }

  public async userDeleted({ user }: EventsList['user:deleted']) {
    //TODO: delete from newsletter
    // Delete all remember me tokens
    await db.from('remember_me_tokens').where('tokenable_id', user.id).delete()
    // Delete all access tokens
    await db.from('auth_access_tokens').where('tokenable_id', user.id).delete()
    // Delete password resets
    await db.from('password_resets').where('user_id', user.id).delete()

    await mailer.send({
      type: 'goodbye',
      data: { email: user.email, fullName: user.fullName || 'User' },
    })
  }

  public async newCustomUser({
    user,
    org,
    subscriptionId,
    session,
  }: EventsList['new:custom-user']) {
    logger.info(`New custom user created for ${user.name} with sub_id ${subscriptionId}`)
    try {
      if (subscriptionId) {
        const subscription = await StripeService.getSubscription(subscriptionId)
        console.log('subscription', subscription)
      }
      if (session) {
        // send an email with
        const url = session.url
      }
    } catch (err) {
      console.log('error getting subscription', err)
    }
  }
}
