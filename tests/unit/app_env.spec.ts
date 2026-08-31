import { test } from '@japa/runner'

import {
  canAccessProd,
  canSwitchEnv,
  prodAccessExpired,
  resolveAppEnv,
} from '#services/app_env_service'

/**
 * The environment decides which database a request reads and writes. `requested` is
 * untrusted input, so these cases pin the rule that only a god admin can act on it.
 */
test.group('resolveAppEnv', () => {
  const godAdmin = { isGodAdmin: true, enableProdAccess: true }
  const prodMember = { isGodAdmin: false, enableProdAccess: true }
  const devMember = { isGodAdmin: false, enableProdAccess: false }

  test('defaults an anonymous request to dev', ({ assert }) => {
    assert.equal(resolveAppEnv(undefined), 'dev')
    assert.equal(resolveAppEnv(null, 'prod'), 'dev')
  })

  test('honours the request only for a god admin', ({ assert }) => {
    assert.equal(resolveAppEnv(godAdmin, 'prod'), 'prod')
    assert.equal(resolveAppEnv(godAdmin, 'dev'), 'dev')
    assert.equal(resolveAppEnv(godAdmin), 'dev')
  })

  test('pins a prod-access member to prod regardless of the request', ({ assert }) => {
    assert.equal(resolveAppEnv(prodMember, 'dev'), 'prod')
    assert.equal(resolveAppEnv(prodMember, 'prod'), 'prod')
  })

  test('never lets a member without prod access reach prod', ({ assert }) => {
    assert.equal(resolveAppEnv(devMember, 'prod'), 'dev')
    assert.equal(resolveAppEnv(devMember, 'dev'), 'dev')
    /** Any unrecognised value must fail closed, not fall through. */
    assert.equal(resolveAppEnv(devMember, 'PROD'), 'dev')
    assert.equal(resolveAppEnv(devMember, '../prod'), 'dev')
  })

  test('reports capabilities consistently', ({ assert }) => {
    assert.isTrue(canAccessProd(godAdmin))
    assert.isTrue(canAccessProd(prodMember))
    assert.isFalse(canAccessProd(devMember))

    assert.isTrue(canSwitchEnv(godAdmin))
    assert.isFalse(canSwitchEnv(prodMember))
    assert.isFalse(canSwitchEnv(devMember))
  })
})

/**
 * A production grant can now be time-boxed. An expired grant must behave exactly like
 * no grant — otherwise "temporary" prod access is permanent in practice.
 */
test.group('prod access expiry', () => {
  const hour = 60 * 60 * 1000
  const now = Date.parse('2026-08-31T12:00:00Z')

  const expiredMember = {
    isGodAdmin: false,
    enableProdAccess: true,
    prodAccessExpiresAt: new Date(now - hour).toISOString(),
  }
  const liveMember = {
    isGodAdmin: false,
    enableProdAccess: true,
    prodAccessExpiresAt: new Date(now + hour).toISOString(),
  }
  const openEndedMember = {
    isGodAdmin: false,
    enableProdAccess: true,
    prodAccessExpiresAt: null,
  }

  test('an expired grant falls back to dev', ({ assert }) => {
    assert.isTrue(prodAccessExpired(expiredMember, now))
    assert.isFalse(canAccessProd(expiredMember, now))
    assert.equal(resolveAppEnv(expiredMember, 'prod', now), 'dev')
  })

  test('a live grant still reaches prod', ({ assert }) => {
    assert.isFalse(prodAccessExpired(liveMember, now))
    assert.equal(resolveAppEnv(liveMember, 'dev', now), 'prod')
  })

  test('a grant with no expiry never lapses', ({ assert }) => {
    assert.isFalse(prodAccessExpired(openEndedMember, now))
    assert.equal(resolveAppEnv(openEndedMember, undefined, now), 'prod')
  })

  test('a god admin is not subject to expiry', ({ assert }) => {
    const god = {
      isGodAdmin: true,
      enableProdAccess: true,
      prodAccessExpiresAt: new Date(now - hour).toISOString(),
    }
    assert.isFalse(prodAccessExpired(god, now))
    assert.equal(resolveAppEnv(god, 'prod', now), 'prod')
  })

  test('accepts a Date or a Luxon-shaped value, not just a string', ({ assert }) => {
    assert.isTrue(
      prodAccessExpired(
        { isGodAdmin: false, enableProdAccess: true, prodAccessExpiresAt: new Date(now - hour) },
        now,
      ),
    )
    assert.isTrue(
      prodAccessExpired(
        {
          isGodAdmin: false,
          enableProdAccess: true,
          prodAccessExpiresAt: { toMillis: () => now - hour },
        },
        now,
      ),
    )
  })
})
