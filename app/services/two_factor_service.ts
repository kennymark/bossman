import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import encryption from '@adonisjs/core/services/encryption'
import logger from '@adonisjs/core/services/logger'
import QRCode from 'qrcode'
import speakeasy from 'speakeasy'

import env from '#start/env'

/** Number of recovery codes issued at a time. */
const RECOVERY_CODE_COUNT = 8

/**
 * Characters per recovery code. The alphabet is 32 symbols, so each character carries
 * exactly 5 bits: 16 characters is 80 bits of entropy.
 */
const RECOVERY_CODE_LENGTH = 16

/**
 * Crockford-style alphabet: no I, L, O or U, so a code read off a screen and typed back
 * cannot be ambiguous.
 */
const RECOVERY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

class TwoFactorService {
  /**
   * Generate a secret for 2FA
   */
  generateSecret(userEmail: string) {
    const appName = env.get('APP_NAME', 'Togetha Admin')
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
   * Encrypts a TOTP secret for storage.
   *
   * The secret is a bearer credential: anyone holding it can mint valid codes forever.
   * It used to sit in the users table in plaintext, so a read-only leak of that one
   * column defeated 2FA for every account at once.
   */
  encryptSecret(secret: string): string {
    return encryption.encrypt(secret)
  }

  /**
   * Reads a stored secret, tolerating rows written before encryption existed.
   *
   * Legacy rows hold a raw base32 secret. They keep working and are re-encrypted the
   * next time the user touches their 2FA settings.
   */
  decryptSecret(stored: string | null): string | null {
    if (!stored) return null

    const decrypted = encryption.decrypt<string>(stored)
    if (typeof decrypted === 'string') return decrypted

    /** Not encrypted — a pre-migration plaintext secret. */
    if (/^[A-Z2-7]+=*$/i.test(stored)) return stored

    logger.warn('Stored 2FA secret could not be read')
    return null
  }

  /** True when the stored value still needs migrating to an encrypted one. */
  secretNeedsMigration(stored: string | null): boolean {
    if (!stored) return false
    return encryption.decrypt<string>(stored) === null
  }

  /**
   * Verify a TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    if (!secret || !token) return false

    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: token.replace(/\s+/g, ''),
      /**
       * One step either side (±30s). This was 2, which accepted a code for two and a
       * half minutes — five times the window an attacker needs.
       */
      window: 1,
    })
  }

  /**
   * Generate recovery codes.
   *
   * These are a complete authentication bypass, and they used to come from
   * `Math.random().toString(36)` — a non-cryptographic PRNG, with a variable length
   * because `toString(36)` on a float is not a fixed width. They are now 80 bits from
   * `randomBytes`.
   */
  generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
    return Array.from({ length: count }, () => this.generateRecoveryCode())
  }

  private generateRecoveryCode(): string {
    /**
     * 256 is an exact multiple of the 32-symbol alphabet, so `% length` is uniform and
     * needs no rejection sampling. One byte in, one character out.
     */
    const bytes = randomBytes(RECOVERY_CODE_LENGTH)
    let code = ''
    for (const byte of bytes) {
      code += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length]
    }
    /** Grouped for legibility: XXXX-XXXX-XXXX-XXXX. */
    return (code.match(/.{1,4}/g) ?? [code]).join('-')
  }

  /** Storage form: codes are hashed, so the column is no longer a credential store. */
  hashRecoveryCodes(codes: string[]): string {
    return JSON.stringify(codes.map((code) => this.hashRecoveryCode(code)))
  }

  private hashRecoveryCode(code: string): string {
    return createHash('sha256').update(this.normaliseCode(code)).digest('hex')
  }

  private normaliseCode(code: string): string {
    return code.trim().toUpperCase().replace(/[\s-]/g, '')
  }

  /** Reads either the hashed JSON array or the legacy comma-separated plaintext. */
  private parseStoredCodes(stored: string | null): { entries: string[]; hashed: boolean } {
    if (!stored?.trim()) return { entries: [], hashed: true }

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return { entries: parsed.filter((c): c is string => typeof c === 'string'), hashed: true }
      }
    } catch {
      /** Falls through to the legacy format. */
    }

    return { entries: stored.split(',').filter(Boolean), hashed: false }
  }

  /**
   * Verify a recovery code.
   *
   * Compares in constant time; the old implementation used `Array.includes` on
   * plaintext codes.
   */
  verifyRecoveryCode(recoveryCodes: string | null, code: string): boolean {
    if (!code?.trim()) return false
    const { entries, hashed } = this.parseStoredCodes(recoveryCodes)
    if (!entries.length) return false

    const candidate = hashed ? this.hashRecoveryCode(code) : this.normaliseCode(code)

    let matched = false
    for (const entry of entries) {
      const stored = hashed ? entry : this.normaliseCode(entry)
      if (constantTimeEquals(stored, candidate)) matched = true
    }
    return matched
  }

  /**
   * Remove a used recovery code, returning the new stored value.
   *
   * Always writes back the hashed format, so consuming one legacy code migrates the
   * whole set.
   */
  removeRecoveryCode(recoveryCodes: string | null, code: string): string {
    const { entries, hashed } = this.parseStoredCodes(recoveryCodes)
    if (!entries.length) return JSON.stringify([])

    const candidate = hashed ? this.hashRecoveryCode(code) : this.normaliseCode(code)

    const remaining = entries.filter((entry) => {
      const stored = hashed ? entry : this.normaliseCode(entry)
      return !constantTimeEquals(stored, candidate)
    })

    /** Legacy plaintext survivors are hashed on the way out. */
    return JSON.stringify(hashed ? remaining : remaining.map((c) => this.hashRecoveryCode(c)))
  }

  /** How many recovery codes the user has left. */
  countRecoveryCodes(recoveryCodes: string | null): number {
    return this.parseStoredCodes(recoveryCodes).entries.length
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  /** `timingSafeEqual` throws on a length mismatch, which is itself not secret. */
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export default new TwoFactorService()
