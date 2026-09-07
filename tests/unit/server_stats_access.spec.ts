import { test } from '@japa/runner'

import { canAccessServerStats } from '#utils/server_stats_access'
import env from '#start/env'

test.group('canAccessServerStats', () => {
  test('denies anonymous callers', ({ assert }) => {
    assert.isFalse(canAccessServerStats(null))
    assert.isFalse(canAccessServerStats(undefined))
  })

  test('always allows god admins', ({ assert }) => {
    assert.isTrue(canAccessServerStats({ isGodAdmin: true, role: 'normal_user' }))
  })

  test('outside production, allows signed-in admins', ({ assert }) => {
    assert.notEqual(env.get('NODE_ENV'), 'production')
    assert.isTrue(canAccessServerStats({ isGodAdmin: false, role: 'super_admin' }))
    assert.isTrue(canAccessServerStats({ isGodAdmin: false, role: 'admin' }))
    assert.isFalse(canAccessServerStats({ isGodAdmin: false, role: 'normal_user' }))
  })
})
