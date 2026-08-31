import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

/** Session key holding a login that has passed the password step but not the code step. */
const PENDING_KEY = 'pending2fa'

/** How long the operator has to enter a code before starting again. */
const CHALLENGE_TTL_MINUTES = 5

/** Wrong codes tolerated on one challenge before it is torn down. */
const MAX_ATTEMPTS = 5

export interface PendingChallenge {
  userId: string
  remember: boolean
  expiresAt: string
  attempts: number
}

/**
 * The half-authenticated state between password and second factor.
 *
 * Deliberately *not* an authenticated session: `auth.login()` is only called once the
 * code has been checked. Before this existed, `login` logged the user straight in and
 * the 2FA endpoints all sat behind `auth()`, so enabling 2FA changed nothing about how
 * anyone actually signed in.
 */
export class TwoFactorChallengeService {
  start(ctx: HttpContext, userId: string, remember: boolean): void {
    const challenge: PendingChallenge = {
      userId,
      remember,
      expiresAt: DateTime.now().plus({ minutes: CHALLENGE_TTL_MINUTES }).toISO()!,
      attempts: 0,
    }
    ctx.session.put(PENDING_KEY, challenge)
  }

  /** The live challenge, or null when there is none, it expired, or it is spent. */
  get(ctx: HttpContext): PendingChallenge | null {
    const raw = ctx.session.get(PENDING_KEY) as PendingChallenge | undefined
    if (!raw?.userId || !raw.expiresAt) return null

    const expiry = DateTime.fromISO(raw.expiresAt)
    if (!expiry.isValid || expiry < DateTime.now()) {
      this.clear(ctx)
      return null
    }

    if (raw.attempts >= MAX_ATTEMPTS) {
      this.clear(ctx)
      return null
    }

    return raw
  }

  /** Counts a failed code. Returns how many attempts remain. */
  recordFailure(ctx: HttpContext): number {
    const challenge = this.get(ctx)
    if (!challenge) return 0

    const attempts = challenge.attempts + 1
    if (attempts >= MAX_ATTEMPTS) {
      this.clear(ctx)
      return 0
    }

    ctx.session.put(PENDING_KEY, { ...challenge, attempts })
    return MAX_ATTEMPTS - attempts
  }

  clear(ctx: HttpContext): void {
    ctx.session.forget(PENDING_KEY)
  }
}

export default new TwoFactorChallengeService()
