import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import twoFactorService from '#services/two_factor_service'

export default class TwoFactorController {
  async setup({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.twoFactorEnabled) {
      return response.badRequest({ error: '2FA is already enabled' })
    }

    const secret = twoFactorService.generateSecret(user.email)
    const qrCode = await twoFactorService.generateQRCode(secret.otpauth_url || '')

    // Store the secret temporarily (user needs to verify before enabling)
    user.twoFactorSecret = secret.base32 || null
    await user.save()

    return response.ok({
      secret: secret.base32,
      qrCode,
      otpAuthUrl: secret.otpauth_url,
    })
  }

  async enable({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { token } = request.only(['token'])

    if (!user.twoFactorSecret) {
      return response.badRequest({ error: 'Please setup 2FA first' })
    }

    if (!token) {
      return response.badRequest({ error: 'Verification token is required' })
    }

    // Verify the token
    const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token)
    if (!isValid) {
      return response.badRequest({ error: 'Invalid verification token' })
    }

    // Generate recovery codes
    const recoveryCodes = twoFactorService.generateRecoveryCodes(8)

    // Enable 2FA
    user.twoFactorEnabled = true
    user.twoFactorRecoveryCodes = recoveryCodes.join(',')
    await user.save()

    return response.ok({
      message: '2FA enabled successfully',
      recoveryCodes, // Show only once
    })
  }

  async disable({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { password } = request.only(['password'])

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

  async verify({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { token, recoveryCode } = request.only(['token', 'recoveryCode'])

    if (!user.twoFactorEnabled) {
      return response.badRequest({ error: '2FA is not enabled' })
    }

    if (!user.twoFactorSecret) {
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
      isValid = twoFactorService.verifyToken(user.twoFactorSecret, token)
    } else {
      return response.badRequest({ error: 'Token or recovery code is required' })
    }

    if (!isValid) {
      return response.badRequest({ error: 'Invalid verification code' })
    }

    return response.ok({ message: '2FA verification successful' })
  }

  async regenerateRecoveryCodes({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { password } = request.only(['password'])

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
    const recoveryCodes = twoFactorService.generateRecoveryCodes(8)
    user.twoFactorRecoveryCodes = recoveryCodes.join(',')
    await user.save()

    return response.ok({
      message: 'Recovery codes regenerated successfully',
      recoveryCodes, // Show only once
    })
  }
}
