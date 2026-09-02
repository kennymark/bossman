import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'

import twoFactorService from '#services/two_factor_service'
import { enableTwoFactorValidator } from '#validators/auth'
import { passwordConfirmationValidator } from '#validators/user'

export default class TwoFactorController {
  async setup({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.twoFactorEnabled) {
      return response.badRequest({ error: '2FA is already enabled' })
    }

    const secret = twoFactorService.generateSecret(user.email)
    if (!secret.base32) {
      return response.internalServerError({ error: 'Could not generate a 2FA secret' })
    }

    const qrCode = await twoFactorService.generateQRCode(secret.otpauth_url || '')

    /** Stored encrypted, and still inert until `enable` verifies a code against it. */
    user.twoFactorSecret = twoFactorService.encryptSecret(secret.base32)
    await user.save()

    return response.ok({
      secret: secret.base32,
      qrCode,
      otpAuthUrl: secret.otpauth_url,
    })
  }

  async enable({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { token } = await request.validateUsing(enableTwoFactorValidator)

    const secret = twoFactorService.decryptSecret(user.twoFactorSecret)
    if (!secret) {
      return response.badRequest({ error: 'Please setup 2FA first' })
    }

    if (!token) {
      return response.badRequest({ error: 'Verification token is required' })
    }

    // Verify the token
    if (!twoFactorService.verifyToken(secret, token)) {
      return response.badRequest({ error: 'Invalid verification token' })
    }

    // Generate recovery codes
    const recoveryCodes = twoFactorService.generateRecoveryCodes()

    // Enable 2FA
    user.twoFactorEnabled = true
    /** Only hashes are persisted — the plaintext below is shown once and discarded. */
    user.twoFactorRecoveryCodes = twoFactorService.hashRecoveryCodes(recoveryCodes)
    /** Re-encrypt a legacy plaintext secret while we are already writing the row. */
    if (twoFactorService.secretNeedsMigration(user.twoFactorSecret)) {
      user.twoFactorSecret = twoFactorService.encryptSecret(secret)
    }
    await user.save()

    return response.ok({
      message: '2FA enabled successfully',
      recoveryCodes, // Show only once
    })
  }

  async disable({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { password } = await request.validateUsing(passwordConfirmationValidator)

    if (!user.twoFactorEnabled) {
      return response.badRequest({ error: '2FA is not enabled' })
    }

    // Verify password
    if (!password) {
      return response.badRequest({ error: 'Password is required to disable 2FA' })
    }

    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      return response.badRequest({ error: 'Invalid password' })
    }

    // Disable 2FA
    user.twoFactorEnabled = false
    user.twoFactorSecret = null
    user.twoFactorRecoveryCodes = null
    await user.save()

    return response.ok({ message: '2FA disabled successfully' })
  }

  /**
   * Re-check the second factor for an already signed-in user.
   *
   * This is a step-up check, not the login gate — the login gate is
   * `POST /api/v1/auth/2fa/challenge`, which runs before any session exists.
   */
  async verify({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { token, recoveryCode } = request.only(['token', 'recoveryCode'])

    if (!user.twoFactorEnabled) {
      return response.badRequest({ error: '2FA is not enabled' })
    }

    const secret = twoFactorService.decryptSecret(user.twoFactorSecret)
    if (!secret) {
      return response.badRequest({ error: '2FA secret not found' })
    }

    let isValid = false

    if (recoveryCode) {
      // Verify recovery code
      isValid = twoFactorService.verifyRecoveryCode(user.twoFactorRecoveryCodes, recoveryCode)
      if (isValid) {
        // Remove used recovery code
        user.twoFactorRecoveryCodes = twoFactorService.removeRecoveryCode(
          user.twoFactorRecoveryCodes,
          recoveryCode,
        )
        await user.save()
      }
    } else if (token) {
      // Verify TOTP token
      isValid = twoFactorService.verifyToken(secret, token)
    } else {
      return response.badRequest({ error: 'Token or recovery code is required' })
    }

    if (!isValid) {
      return response.badRequest({ error: 'Invalid verification code' })
    }

    return response.ok({
      message: '2FA verification successful',
      recoveryCodesRemaining: twoFactorService.countRecoveryCodes(user.twoFactorRecoveryCodes),
    })
  }

  async regenerateRecoveryCodes({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { password } = await request.validateUsing(passwordConfirmationValidator)

    if (!user.twoFactorEnabled) {
      return response.badRequest({ error: '2FA is not enabled' })
    }

    // Verify password
    if (!password) {
      return response.badRequest({ error: 'Password is required' })
    }

    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      return response.badRequest({ error: 'Invalid password' })
    }

    // Generate new recovery codes
    const recoveryCodes = twoFactorService.generateRecoveryCodes()
    user.twoFactorRecoveryCodes = twoFactorService.hashRecoveryCodes(recoveryCodes)
    await user.save()

    return response.ok({
      message: 'Recovery codes regenerated successfully',
      recoveryCodes, // Show only once
    })
  }

  /** How many recovery codes remain, for the settings page. */
  async status({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    return response.ok({
      enabled: user.twoFactorEnabled,
      recoveryCodesRemaining: twoFactorService.countRecoveryCodes(user.twoFactorRecoveryCodes),
    })
  }
}
