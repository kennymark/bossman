import { test } from '@japa/runner'

import { canAccessProd, canSwitchEnv, resolveAppEnv } from '#services/app_env_service'

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
