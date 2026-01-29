import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import env from '#start/env'

class TwoFactorService {
  /**
   * Generate a secret for 2FA
   */
  generateSecret(userEmail: string) {
    const appName = env.get('APP_NAME', 'Starter Template')
    return speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32,
    })
  }

  /**
   * Generate QR code data URL for the secret
   */
  async generateQRCode(otpAuthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpAuthUrl)
  }

  /**
   * Verify a TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    })
  }

  /**
   * Generate recovery codes
   */
  generateRecoveryCodes(count: number = 8): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  /**
   * Verify a recovery code
   */
  verifyRecoveryCode(recoveryCodes: string | null, code: string): boolean {
    if (!recoveryCodes) return false
    const codes = recoveryCodes.split(',')
    return codes.includes(code.toUpperCase())
  }

  /**
   * Remove a used recovery code
   */
  removeRecoveryCode(recoveryCodes: string | null, code: string): string {
    if (!recoveryCodes) return ''
    const codes = recoveryCodes.split(',').filter((c) => c !== code.toUpperCase())
    return codes.join(',')
  }
}

export default new TwoFactorService()
