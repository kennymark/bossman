import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import AdminAction from '#models/admin_action'
import TeamMember from '#models/team_member'
import User from '#models/user'

/**
 * CSV exports leave the console, so they sit behind the same gate as the page they
 * belong to, and every one of them is written to the audit trail.
 *
 * The three customer-data exports read the dev/prod application databases, which the
 * suite cannot reach, so those cases assert only that the request is *rejected*. The
 * audit export reads the admin database and is exercised end to end.
 */
test.group('CSV exports', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function makeUser(attrs: Partial<User> = {}) {
    return User.create({
      fullName: 'Test User',
      email: `${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123',
      role: 'normal_user',
      isGodAdmin: false,
      enableProdAccess: false,
      emailVerified: true,
      ...attrs,
    } as Partial<User>)
  }

  function restrictTo(userId: string, allowedPages: string[]) {
    return TeamMember.create({
      userId,
      role: 'member',
      allowedPages,
      enableProdAccess: false,
    } as Partial<TeamMember>)
  }

  const PAGE_GATED_EXPORTS = [
    '/api/v1/orgs/export',
    '/api/v1/leases/export',
    '/api/v1/leaseable-entities/export',
  ]

  test('rejects an anonymous caller from every page-gated export', async ({ client }) => {
    for (const path of PAGE_GATED_EXPORTS) {
      const response = await client.get(path).accept('json').redirects(0)
      response.assertStatus(401)
    }
  })

  test('rejects a signed-in non-admin from every page-gated export', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    for (const path of PAGE_GATED_EXPORTS) {
      const response = await client.get(path).loginAs(user).redirects(0)
      response.assertStatus(403)
    }
  })

  test('rejects an admin without the page grant', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })
    /** Granted the dashboard only — none of the export pages. */
    await restrictTo(user.id, ['dashboard'])

    for (const path of PAGE_GATED_EXPORTS) {
      const response = await client.get(path).loginAs(user).redirects(0)
      response.assertStatus(403)
    }
  })

  test('rejects an anonymous caller from the audit export', async ({ client }) => {
    const response = await client.get('/api/v1/audits/export').accept('json').redirects(0)

    response.assertStatus(401)
  })

  test('serves the audit trail as a CSV attachment and records the export', async ({
    client,
    assert,
  }) => {
    const user = await makeUser({ role: 'admin' })

    const response = await client.get('/api/v1/audits/export').loginAs(user).redirects(0)

    response.assertStatus(200)
    assert.include(String(response.header('content-type')), 'text/csv')
    assert.match(
      String(response.header('content-disposition')),
      /^attachment; filename="admin-actions-\d{4}-\d{2}-\d{2}\.csv"$/,
    )
    assert.include(response.text(), '"ID","When","Actor email"')

    const recorded = await AdminAction.query()
      .where('action', 'export.csv')
      .where('actorId', user.id)
      .first()

    assert.exists(recorded)
    assert.equal(recorded!.targetType, 'AdminAction')
    assert.match(recorded!.targetLabel ?? '', /^admin-actions-.*\.csv$/)
    assert.equal(recorded!.metadata?.rows, 0)
    assert.equal(recorded!.metadata?.truncated, false)
  })

  test('scopes a regular admin to their own rows, whatever the filters say', async ({
    client,
    assert,
  }) => {
    const user = await makeUser({ role: 'admin' })
    const other = await makeUser({ role: 'admin' })

    await AdminAction.create({
      actorId: other.id,
      actorEmail: other.email,
      action: 'org.ban',
      targetType: 'Org',
      targetId: 'org-1',
      targetLabel: 'someone-elses-customer',
      outcome: 'success',
    })
    await AdminAction.create({
      actorId: user.id,
      actorEmail: user.email,
      action: 'org.ban',
      targetType: 'Org',
      targetId: 'org-1',
      targetLabel: 'my-customer',
      outcome: 'success',
    })

    const response = await client
      .get('/api/v1/audits/export')
      .qs({ actorId: other.id, targetType: 'org', targetId: 'org-1' })
      .loginAs(user)
      .redirects(0)

    response.assertStatus(200)
    const body = response.text()
    assert.include(body, 'my-customer')
    assert.notInclude(body, 'someone-elses-customer')
  })

  test('lets a super admin export another actor and filters by target', async ({
    client,
    assert,
  }) => {
    const superAdmin = await makeUser({ role: 'super_admin' })
    const other = await makeUser({ role: 'admin' })

    await AdminAction.create({
      actorId: other.id,
      actorEmail: other.email,
      action: 'org.ban',
      targetType: 'Org',
      targetId: 'org-1',
      targetLabel: 'wanted-row',
      outcome: 'success',
    })
    await AdminAction.create({
      actorId: other.id,
      actorEmail: other.email,
      action: 'org.ban',
      targetType: 'Org',
      targetId: 'org-2',
      targetLabel: 'unwanted-row',
      outcome: 'success',
    })

    const response = await client
      .get('/api/v1/audits/export')
      .qs({ actorId: other.id, targetType: 'org', targetId: 'org-1' })
      .loginAs(superAdmin)
      .redirects(0)

    response.assertStatus(200)
    const body = response.text()
    assert.include(body, 'wanted-row')
    assert.notInclude(body, 'unwanted-row')
  })

  test('rejects an invalid filter value', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })

    const response = await client
      .get('/api/v1/audits/export')
      .qs({ outcome: 'maybe' })
      .accept('json')
      .loginAs(user)
      .redirects(0)

    /** The exception handler answers validation failures with 400, not 422. */
    response.assertStatus(400)
    response.assertBodyContains({ type: 'validation' })
  })
})
