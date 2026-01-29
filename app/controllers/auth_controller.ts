import { randomUUID } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { appUrl } from '#emails/global'
import PasswordReset from '#models/password_reset'
import User from '#models/user'
import { generateShortId } from '#services/app.functions'
import sessionService from '#services/session_service'
import { forgotPasswordValidator, loginValidator, resetPasswordValidator } from '#validators/auth'

export default class AuthController {
  async login({ request, response, auth, now, session }: HttpContext) {
    const { email, password, remember } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    await auth.use('web').login(user, remember)
    await user.merge({ lastLoginAt: now }).save()

    // Create or update session
    const deviceSessionId = randomUUID()
    // Persist the device session id in the session cookie so we can enforce revokes
    session.put('deviceSessionId', deviceSessionId)
    await sessionService.createOrUpdateSession({
      deviceSessionId,
      userId: user.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent') || null,
      lastActivity: now,
    })

    return response.ok({
      message: 'Login successful',
      data: {
        user,
        redirectTo: '/dashboard',
      },
    })
  }

  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.forget('deviceSessionId')
    return response.redirect('/')
  }

  async forgotPassword({ request, response, logger, mailer }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const token = generateShortId(20) // Generate a unique token
    const expiresAt = DateTime.now().plus({ hours: 1 }) // Set the expiration date to 1 hour from now
    const user = await User.findBy('email', email)

    if (!user) {
      return response.badRequest({ error: "There's no account with this email" })
    }

    // Save the token to the password_resets table
    await PasswordReset.create({
      userId: user?.id,
      email,
      token,
      expiresAt,
    })

    // Send an email to the user with a link to reset their password
    try {
      await mailer.send('forgot-password', {
        email: user.email,
        fullName: user.fullName || 'User',
        token,
      })

      return response.ok({ message: 'Password reset email sent.' })
    } catch (error) {
      logger.error('Error sending password reset email', error)
      return response.internalServerError({
        error: 'Error sending password reset email',
      })
    }
  }

  async resetPassword({ request, response, now, mailer }: HttpContext) {
    const { newPassword, token } = await request.validateUsing(resetPasswordValidator)
    const resetRequest = await PasswordReset.findBy('token', token)

    if (!resetRequest) {
      return response.badRequest({
        error:
          'The reset token provided is invalid or has expired. Request another password reset.',
      })
    }
    const expiresAt = resetRequest.expiresAt.toMillis()
    if (expiresAt < now.toMillis()) {
      return response.badRequest({
        error: 'Token has expired. Request another password reset',
      })
    }

    const user = await User.findOrFail(resetRequest.userId)
    user.password = newPassword
    await user.save()

    mailer.send('reset-password', {
      email: user.email,
      fullName: user.fullName || 'user',
    })

    await resetRequest.delete()

    return response.ok({
      message: 'Password reset successful. We will log you out of all previous sessions',
    })
  }

  async verifyEmail({ request, response, now, logger }: HttpContext) {
    const token = request.qs().token
    logger.info(`Verifying email with token: ${token}`)

    if (!token) {
      logger.warn('Email verification attempted without token')
      return response.badRequest({ error: 'Verification token is required' })
    }

    const user = await User.findByOrFail('token', token)
    logger.info('User found', { userId: user.id, email: user.email })

    if (user.emailVerified) {
      logger.info('Email verification attempted for already verified user', { userId: user.id })
      return response.badRequest({ error: 'Email is already verified.' })
    }

    await user.merge({ emailVerified: true, emailVerifiedAt: now, token: null }).save()

    logger.info('Email verified successfully', { userId: user.id, email: user.email })

    return response.ok({ message: 'Email verified successfully' })
  }

  async resendVerificationEmail({ auth, response, logger, mailer }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.emailVerified) {
      return response.badRequest({ error: 'Email is already verified' })
    }

    // Generate new verification token
    const token = generateShortId(32)
    await user.merge({ token }).save()

    try {
      const verificationUrl = `${appUrl}/verify-email?token=${token}`
      await mailer.send('verify-email', {
        email: user.email,
        fullName: user.fullName || 'User',
        url: verificationUrl,
      })

      return response.ok({ message: 'Verification email sent successfully' })
    } catch (error) {
      logger.error('Error sending verification email', error)
      return response.internalServerError({
        error: 'Error sending verification email',
      })
    }
  }

  async verifyEmailChange({ request, response, logger }: HttpContext) {
    const token = request.qs().token
    logger.info(`Verifying email change with token: ${token}`)

    if (!token) {
      logger.warn('Email change verification attempted without token')
      return response.badRequest({ error: 'Verification token is required' })
    }

    const user = await User.findByOrFail('emailChangeToken', token)
    logger.info('User found for email change', { userId: user.id, pendingEmail: user.pendingEmail })

    if (!user.pendingEmail) {
      logger.warn('Email change verification attempted but no pending email', { userId: user.id })
      return response.badRequest({ error: 'No pending email change found.' })
    }

    // Check if the pending email is already taken by another user
    const existingUser = await User.findBy('email', user.pendingEmail)
    if (existingUser && existingUser.id !== user.id) {
      return response.conflict({ error: 'This email address is already in use.' })
    }

    // Update email and clear pending fields
    await user
      .merge({
        email: user.pendingEmail,
        pendingEmail: null,
        emailChangeToken: null,
        // Email remains verified since the user already verified their original email
      })
      .save()

    logger.info('Email change verified successfully', {
      userId: user.id,
      oldEmail: user.email,
      newEmail: user.pendingEmail,
    })

    return response.ok({ message: 'Email address changed successfully' })
  }
}
