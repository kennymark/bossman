/**
 * One-shot sign-in handoff between the admin console and the Togetha app.
 *
 * Wire format: `base64url(payload) + '.' + base64url(hmacSha256(secret, base64url(payload)))`.
 * The signature covers the encoded payload exactly as sent, so the receiver verifies
 * before it parses any JSON. Both apps carry an identical copy of this module
 * (`app/services/impersonation_token.ts` here, `app/services/admin_impersonation_token.ts`
 * in togetha-v2); it depends on `node:crypto` only so it stays trivially portable.
 *
 * What the token does *not* do: it is not a session. It is short-lived (90 seconds),
 * bound to one environment, and the receiver records the `jti` so it is accepted once.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const IMPERSONATION_TOKEN_VERSION = 1 as const
export const IMPERSONATION_TOKEN_TTL_SECONDS = 90

export type ImpersonationEnv = 'dev' | 'prod'

export interface ImpersonationTokenPayload {
  v: typeof IMPERSONATION_TOKEN_VERSION
  /** Target user's email, lower-cased. */
  sub: string
  /** Target user's id. */
  uid: string
  /** Org the target belongs to; the receiver checks the user is really in it. */
  org: string
  /** Environment the token was minted for; must equal the receiving app's own. */
  env: ImpersonationEnv
  /** Operator who asked for the handoff. */
  by: string
  reason: string
  /** Unix seconds. */
  iat: number
  exp: number
  /** Random nonce, hex; consumed once by the receiver. */
  jti: string
}

export type ImpersonationTokenClaims = Pick<
  ImpersonationTokenPayload,
  'sub' | 'uid' | 'org' | 'env' | 'by' | 'reason'
>

export type ImpersonationTokenError =
  | 'malformed'
  | 'bad_signature'
  | 'unsupported_version'
  | 'expired'
  | 'wrong_env'

export type ImpersonationTokenVerification =
  | { ok: true; payload: ImpersonationTokenPayload }
  | { ok: false; error: ImpersonationTokenError }

const ENVS: readonly ImpersonationEnv[] = ['dev', 'prod']
const JTI_PATTERN = /^[0-9a-f]{32}$/

function hmac(secret: string, encodedPayload: string): Buffer {
  return createHmac('sha256', secret).update(encodedPayload).digest()
}

function nowSeconds(now?: number): number {
  return Math.floor((now ?? Date.now()) / 1000)
}

function isPayload(value: unknown): value is ImpersonationTokenPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.v === 'number' &&
    typeof p.sub === 'string' &&
    p.sub.length > 0 &&
    typeof p.uid === 'string' &&
    p.uid.length > 0 &&
    typeof p.org === 'string' &&
    p.org.length > 0 &&
    typeof p.env === 'string' &&
    ENVS.includes(p.env as ImpersonationEnv) &&
    typeof p.by === 'string' &&
    typeof p.reason === 'string' &&
    typeof p.iat === 'number' &&
    Number.isFinite(p.iat) &&
    typeof p.exp === 'number' &&
    Number.isFinite(p.exp) &&
    typeof p.jti === 'string' &&
    JTI_PATTERN.test(p.jti)
  )
}

/**
 * Signs a handoff for one user. `now` and `ttlSeconds` exist for tests; production
 * callers take the defaults.
 */
export function mintImpersonationToken(
  secret: string,
  claims: ImpersonationTokenClaims,
  options: { now?: number; ttlSeconds?: number } = {},
): { token: string; payload: ImpersonationTokenPayload } {
  if (!secret) throw new Error('An impersonation secret is required to mint a token')

  const iat = nowSeconds(options.now)
  const payload: ImpersonationTokenPayload = {
    v: IMPERSONATION_TOKEN_VERSION,
    sub: claims.sub.trim().toLowerCase(),
    uid: String(claims.uid),
    org: String(claims.org),
    env: claims.env,
    by: claims.by.trim().toLowerCase(),
    reason: claims.reason.trim(),
    iat,
    exp: iat + (options.ttlSeconds ?? IMPERSONATION_TOKEN_TTL_SECONDS),
    jti: randomBytes(16).toString('hex'),
  }

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = hmac(secret, encoded).toString('base64url')

  return { token: `${encoded}.${signature}`, payload }
}

/**
 * Checks signature, then shape, then expiry, then environment — in that order, so a
 * forged token is rejected before anything inside it is trusted enough to parse.
 *
 * Replay protection is the caller's job: this function is pure and has no memory.
 */
export function verifyImpersonationToken(
  secret: string,
  token: unknown,
  options: { env: ImpersonationEnv; now?: number },
): ImpersonationTokenVerification {
  if (!secret || typeof token !== 'string') return { ok: false, error: 'malformed' }

  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, error: 'malformed' }
  const [encoded, signature] = parts

  const expected = hmac(secret, encoded)
  const provided = Buffer.from(signature, 'base64url')
  /**
   * `timingSafeEqual` throws on unequal lengths; comparing `expected` with itself in
   * that case keeps the timing profile the same and still yields a rejection.
   */
  const sameLength = provided.length === expected.length
  const matches = timingSafeEqual(sameLength ? provided : expected, expected) && sameLength
  if (!matches) return { ok: false, error: 'bad_signature' }

  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    return { ok: false, error: 'malformed' }
  }
  if (!isPayload(parsed)) return { ok: false, error: 'malformed' }
  if (parsed.v !== IMPERSONATION_TOKEN_VERSION) return { ok: false, error: 'unsupported_version' }
  if (parsed.exp <= nowSeconds(options.now)) return { ok: false, error: 'expired' }
  if (parsed.env !== options.env) return { ok: false, error: 'wrong_env' }

  return { ok: true, payload: parsed }
}
