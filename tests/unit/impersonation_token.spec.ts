import { createHmac } from 'node:crypto'

import { test } from '@japa/runner'

import {
  IMPERSONATION_TOKEN_TTL_SECONDS,
  type ImpersonationTokenClaims,
  mintImpersonationToken,
  verifyImpersonationToken,
} from '#services/impersonation_token'

const SECRET = 'unit-test-secret-not-a-real-one'

const claims: ImpersonationTokenClaims = {
  sub: 'Owner@Example.com',
  uid: 'user_123',
  org: 'org_456',
  env: 'dev',
  by: 'Operator@Togetha.co.uk',
  reason: 'Investigating a billing report',
}

/**
 * The token is the whole security boundary between the console and a customer's
 * account, so each check in `verifyImpersonationToken` gets its own case.
 */
test.group('impersonation token', () => {
  test('round-trips its claims and normalises emails', ({ assert }) => {
    const { token, payload } = mintImpersonationToken(SECRET, claims)

    const result = verifyImpersonationToken(SECRET, token, { env: 'dev' })

    assert.isTrue(result.ok)
    if (!result.ok) return
    assert.deepEqual(result.payload, payload)
    assert.equal(result.payload.sub, 'owner@example.com')
    assert.equal(result.payload.by, 'operator@togetha.co.uk')
    assert.equal(result.payload.exp - result.payload.iat, IMPERSONATION_TOKEN_TTL_SECONDS)
    assert.match(result.payload.jti, /^[0-9a-f]{32}$/)
  })

  test('issues a fresh nonce every time', ({ assert }) => {
    const first = mintImpersonationToken(SECRET, claims)
    const second = mintImpersonationToken(SECRET, claims)

    assert.notEqual(first.payload.jti, second.payload.jti)
    assert.notEqual(first.token, second.token)
  })

  test('rejects a tampered signature', ({ assert }) => {
    const { token } = mintImpersonationToken(SECRET, claims)
    const [encoded, signature] = token.split('.')
    const flipped = (signature[0] === 'A' ? 'B' : 'A') + signature.slice(1)

    const result = verifyImpersonationToken(SECRET, `${encoded}.${flipped}`, { env: 'dev' })

    assert.deepEqual(result, { ok: false, error: 'bad_signature' })
  })

  test('rejects a tampered payload', ({ assert }) => {
    const { token } = mintImpersonationToken(SECRET, claims)
    const [encoded, signature] = token.split('.')
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(encoded, 'base64url').toString()), env: 'prod' }),
    ).toString('base64url')

    const result = verifyImpersonationToken(SECRET, `${forged}.${signature}`, { env: 'prod' })

    assert.deepEqual(result, { ok: false, error: 'bad_signature' })
  })

  test('rejects a token signed with another secret', ({ assert }) => {
    const { token } = mintImpersonationToken('some-other-secret', claims)

    const result = verifyImpersonationToken(SECRET, token, { env: 'dev' })

    assert.deepEqual(result, { ok: false, error: 'bad_signature' })
  })

  test('rejects an expired token', ({ assert }) => {
    const minted = Date.UTC(2026, 0, 1, 12, 0, 0)
    const { token } = mintImpersonationToken(SECRET, claims, { now: minted })

    const justBefore = verifyImpersonationToken(SECRET, token, {
      env: 'dev',
      now: minted + (IMPERSONATION_TOKEN_TTL_SECONDS - 1) * 1000,
    })
    const atExpiry = verifyImpersonationToken(SECRET, token, {
      env: 'dev',
      now: minted + IMPERSONATION_TOKEN_TTL_SECONDS * 1000,
    })

    assert.isTrue(justBefore.ok)
    assert.deepEqual(atExpiry, { ok: false, error: 'expired' })
  })

  test('rejects a token minted for the other environment', ({ assert }) => {
    const { token } = mintImpersonationToken(SECRET, { ...claims, env: 'dev' })

    const result = verifyImpersonationToken(SECRET, token, { env: 'prod' })

    assert.deepEqual(result, { ok: false, error: 'wrong_env' })
  })

  test('rejects anything that is not a two-part token', ({ assert }) => {
    for (const bad of [undefined, null, 42, '', 'abc', 'a.b.c', '.sig', 'payload.']) {
      const result = verifyImpersonationToken(SECRET, bad, { env: 'dev' })
      assert.isFalse(result.ok, `expected ${String(bad)} to be rejected`)
    }
  })

  test('rejects a well-signed payload with the wrong shape', ({ assert }) => {
    const encoded = Buffer.from(JSON.stringify({ v: 1, sub: 'x' })).toString('base64url')
    const { token } = mintImpersonationToken(SECRET, claims)
    /** Re-sign the bogus payload properly so only the shape check can reject it. */
    const signature = createHmac('sha256', SECRET).update(encoded).digest('base64url')
    assert.isString(token)

    const result = verifyImpersonationToken(SECRET, `${encoded}.${signature}`, { env: 'dev' })

    assert.deepEqual(result, { ok: false, error: 'malformed' })
  })

  test('refuses to mint without a secret', ({ assert }) => {
    assert.throws(() => mintImpersonationToken('', claims))
  })
})
