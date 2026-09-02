import { test } from '@japa/runner'

import {
  canAccessProd,
  canSwitchEnv,
  canWriteProd,
  prodAccessExpired,
  resolveAppEnv,
} from '#services/app_env_service'
import { PAGE_KEYS } from '#utils/page_access'
import {
  effectiveProdAccessMode,
  isProdWriteBlocked,
  PROD_WRITE_GATED_KEYS,
} from '#utils/prod_access'

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

/**
 * A production grant can be read-only. Reading is unchanged; every mutating request
 * against customer data must be refused. God admins and the dev database are never
 * affected — this narrows a grant, it must never widen one.
 */
test.group('read-only prod access', () => {
  const godAdmin = { isGodAdmin: true, enableProdAccess: true, prodAccessMode: 'read' }
  const writer = { isGodAdmin: false, enableProdAccess: true, prodAccessMode: 'write' }
  const reader = { isGodAdmin: false, enableProdAccess: true, prodAccessMode: 'read' }
  const legacy = { isGodAdmin: false, enableProdAccess: true }

  test('resolves the effective mode to the stricter record', ({ assert }) => {
    assert.equal(effectiveProdAccessMode(writer), 'write')
    assert.equal(effectiveProdAccessMode(reader), 'read')
    assert.equal(effectiveProdAccessMode(writer, { prodAccessMode: 'read' }), 'read')
    assert.equal(effectiveProdAccessMode(reader, { prodAccessMode: 'write' }), 'read')
    assert.equal(effectiveProdAccessMode(writer, null), 'write')
    /** A record from before the column existed counts as write, as it always was. */
    assert.equal(effectiveProdAccessMode(legacy), 'write')
    /** A god admin's stored mode is irrelevant. */
    assert.equal(effectiveProdAccessMode(godAdmin, { prodAccessMode: 'read' }), 'write')
  })

  test('canWriteProd needs a live grant and a write mode', ({ assert }) => {
    assert.isTrue(canWriteProd(godAdmin))
    assert.isTrue(canWriteProd(writer))
    assert.isFalse(canWriteProd(reader))
    assert.isFalse(canWriteProd(writer, { prodAccessMode: 'read' }))
    assert.isFalse(canWriteProd({ isGodAdmin: false, enableProdAccess: false }))
    assert.isFalse(canWriteProd(null))

    const hour = 60 * 60 * 1000
    const now = Date.parse('2026-08-31T12:00:00Z')
    const lapsed = { ...writer, prodAccessExpiresAt: new Date(now - hour).toISOString() }
    assert.isFalse(canWriteProd(lapsed, null, now))
  })

  test('blocks a mutating prod request on a customer-data page for a reader', ({ assert }) => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'post']) {
      assert.isTrue(
        isProdWriteBlocked({
          method,
          path: '/api/v1/orgs/1/actions/ban-user',
          appEnv: 'prod',
          user: reader,
        }),
        `${method} must be blocked`,
      )
    }
  })

  test('covers every customer-data page key and only those', ({ assert }) => {
    const gated = [
      '/api/v1/orgs/actions/bulk-make-favourite',
      '/api/v1/leases/1',
      '/api/v1/leaseable-entities/1',
      '/api/v1/maintenance/1',
      '/api/v1/documents/1',
      '/api/v1/push-notifications',
      '/api/v1/dashboard/refresh',
      '/api/v1/analytics/refresh',
      '/api/v1/jobs/1/rerun',
      '/api/v1/db-backups/3/restore',
      '/db-backups/3',
    ]
    for (const path of gated) {
      assert.isTrue(
        isProdWriteBlocked({ method: 'POST', path, appEnv: 'prod', user: reader }),
        `${path} must be blocked`,
      )
    }

    const open = [
      '/api/v1/members/1',
      '/api/v1/invitations/1',
      '/blog/manage/1',
      '/api/v1/emails/1',
      '/api/v1/railway/services/1/restart',
      '/addons/1',
      '/api/v1/logs',
      '/api/v1/api-access/keys',
      '/api/v1/update-env',
      '/api/v1/user/settings',
      '/api/v1/notifications/1/read',
    ]
    for (const path of open) {
      assert.isFalse(
        isProdWriteBlocked({ method: 'POST', path, appEnv: 'prod', user: reader }),
        `${path} must not be blocked`,
      )
    }

    for (const key of PROD_WRITE_GATED_KEYS) {
      assert.include(PAGE_KEYS, key, `${key} must be a real page key`)
    }
  })

  test('never blocks reads, dev, writers or god admins', ({ assert }) => {
    const path = '/api/v1/orgs/1/actions/ban-user'
    assert.isFalse(isProdWriteBlocked({ method: 'GET', path, appEnv: 'prod', user: reader }))
    assert.isFalse(isProdWriteBlocked({ method: 'HEAD', path, appEnv: 'prod', user: reader }))
    assert.isFalse(isProdWriteBlocked({ method: 'POST', path, appEnv: 'dev', user: reader }))
    assert.isFalse(isProdWriteBlocked({ method: 'POST', path, appEnv: 'prod', user: writer }))
    assert.isFalse(isProdWriteBlocked({ method: 'POST', path, appEnv: 'prod', user: godAdmin }))
    assert.isFalse(isProdWriteBlocked({ method: 'POST', path, appEnv: 'prod', user: null }))
    /** The member row can only narrow the grant. */
    assert.isTrue(
      isProdWriteBlocked({
        method: 'POST',
        path,
        appEnv: 'prod',
        user: writer,
        member: { prodAccessMode: 'read' },
      }),
    )
    assert.isTrue(
      isProdWriteBlocked({
        method: 'POST',
        path,
        appEnv: 'prod',
        user: reader,
        member: { prodAccessMode: 'write' },
      }),
    )
  })

  test('ignores the query string when deriving the page', ({ assert }) => {
    assert.isTrue(
      isProdWriteBlocked({
        method: 'DELETE',
        path: '/api/v1/leases/1?redirect=/settings',
        appEnv: 'prod',
        user: reader,
      }),
    )
  })
})
