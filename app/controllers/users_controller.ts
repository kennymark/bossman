import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import hash from '@adonisjs/core/services/hash'
import { attachmentManager } from '@jrmc/adonis-attachment'
import { appUrl } from '#emails/global'
import User from '#models/user'
import { generateShortId } from '#services/app.functions'
import mailer from '#services/email_service'
import { updatePasswordValidator, updateProfileValidator } from '#validators/user'
import { allowedImageExtensions } from '../data/file.js'

export default class UsersController {
  async updateProfile({ auth, request, response, logger }: HttpContext) {
    const user = auth.getUserOrFail()

    // Require email verification for any profile updates
    if (!user.emailVerified) {
      return response.forbidden({
        error: 'Please verify your email address before updating your profile.',
      })
    }

    const body = await request.validateUsing(updateProfileValidator)

    // Handle email change
    if (body.email && body.email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findBy('email', body.email)
      if (existingUser && existingUser.id !== user.id) {
        return response.conflict({ error: 'Email is already taken' })
      }

      // Check if pending email is already taken
      const existingPendingUser = await User.findBy('pendingEmail', body.email)
      if (existingPendingUser && existingPendingUser.id !== user.id) {
        return response.conflict({ error: 'Email is already taken' })
      }

      // Generate token for email change verification
      const emailChangeToken = generateShortId(32)
      user.pendingEmail = body.email
      user.emailChangeToken = emailChangeToken

      // Send verification email to the new email address
      try {
        const verificationUrl = `${appUrl}/verify-email-change?token=${emailChangeToken}`
        const oldEmail = user.email

        // Send verification email to new email
        await mailer.send({
          type: 'verify-email-change',
          data: {
            email: body.email,
            fullName: user.fullName || 'User',
            url: verificationUrl,
          },
        })

        // Send notification email to old email
        await mailer.send({
          type: 'simple-send',
          data: {
            email: oldEmail,
            subject: 'Email Change Request',
            body: `
              <p>Hello ${user.fullName || 'User'},</p>
              <p>We received a request to change your email address from <strong>${oldEmail}</strong> to <strong>${body.email}</strong>.</p>
              <p>If you did not request this change, please contact support immediately.</p>
              <p>Otherwise, please verify your new email address to complete the change.</p>
            `,
          },
        })

        await user.save()

        return response.ok({
          message:
            'A verification email has been sent to your new email address. Please verify it to complete the email change.',
          data: { user },
        })
      } catch (error) {
        logger.error('Error sending email change verification', error)
        return response.internalServerError({
          error: 'Failed to send verification email. Please try again.',
        })
      }
    }

    // Update full name if provided
    if (body.fullName !== undefined) {
      user.fullName = body.fullName
    }

    await user.save()

    return response.ok({ message: 'Profile updated successfully', data: { user } })
  }

  async uploadAvatar({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const avatar = request.file('avatar', {
      size: '5mb',
      extnames: allowedImageExtensions,
    })

    if (!avatar) {
      return response.badRequest({ error: 'Avatar file is required' })
    }

    if (!avatar.isValid) {
      return response.badRequest({ error: avatar.errors[0].message })
    }

    // @ts-expect-error - @attachment() decorator
    user.avatar = await attachmentManager.createFromFile(avatar)
    await user.save()

    return response.ok({ message: 'Avatar uploaded successfully', data: { user } })
  }

  async deleteAvatar({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.avatar) {
      await user.merge({ avatar: null }).save()
    }

    return response.ok({ message: 'Avatar deleted successfully', data: { user } })
  }

  async updatePassword({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    // Require email verification before allowing password change
    if (!user.emailVerified) {
      return response.forbidden({
        error: 'Please verify your email address before changing your password.',
      })
    }

    const body = await request.validateUsing(updatePasswordValidator)

    if (body.newPassword !== body.confirmPassword) {
      return response.badRequest({ error: 'New passwords do not match' })
    }

    const isValid = await hash.verify(user.password, body.currentPassword)

    if (!isValid) {
      return response.badRequest({ error: 'Current password is incorrect' })
    }

    user.password = body.newPassword
    await user.save()

    // Send email notification
    await mailer.send({
      type: 'password-changed',
      data: {
        email: user.email,
        fullName: user.fullName || 'User',
      },
    })

    return response.ok({ message: 'Password updated successfully' })
  }

  async deleteAccount({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { password } = request.only(['password'])

    if (!password) {
      return response.badRequest({ error: 'Password is required to delete account' })
    }

    // Verify password
    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      return response.badRequest({ error: 'Invalid password' })
    }

    // Emit event for user deletion (before deleting the user so we have access to the full user object)
    emitter.emit('user:deleted', { user })

    // Delete the user
    await user.delete()

    // Logout
    await auth.use('web').logout()

    return response.ok({ message: 'Account deleted successfully' })
  }

  async updateSettings({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const settings = request.body().settings

    if (typeof settings !== 'object' || settings === null) {
      return response.badRequest({ error: 'Settings must be an object' })
    }

    user.settings = { ...(user.settings || {}), ...settings }
    await user.save()

    return response.ok({
      message: 'Settings updated successfully',
      data: { settings: user.settings },
    })
  }

  async getSettings({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    return response.ok({ settings: user.settings || {} })
  }
}
