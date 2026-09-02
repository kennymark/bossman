import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import AdminAction from '#models/admin_action'
import TeamMember from '#models/team_member'
import User from '#models/user'
import { CONFIRMATION_PHRASES } from '#utils/confirmation'

/**
 * Destructive actions must refuse a missing reason or a wrong confirmation phrase, and
 * a refused call must leave no successful row in `admin_actions`.
 *
 * What each test can prove depends on where the handler validates:
 *
 * - `ban-user` and the bulk actions validate the body before loading any org, so the
 *   validation outcome (400, `type: 'validation'`) is observable here.
 * - `request-delete-custom-user`, `DELETE /db-backups/:id`, the ban's confirmation
 *   phrase and the bulk phrase are all checked *after* loading a row from the customer
 *   database, which the test database does not have. For those the tests pin what is
 *   still true — no success is recorded and no 2xx is returned — and a read-only
 *   production member is refused before any lookup at all.
 * - Member removal lives entirely in the admin database and is covered end to end.
 *
 * Validation failures are 400 here, not 422: `HttpExceptionHandler` maps VineJS errors
 * to `badRequest` with `type: 'validation'`.
 */
test.group('Destructive actions', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function makeUser(attrs: Partial<User> = {}) {
    return User.create({
      fullName: 'Test User',
      email: `${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123',
      role: 'super_admin',
      isGodAdmin: false,
      enableProdAccess: false,
      prodAccessMode: 'write',
      emailVerified: true,
      ...attrs,
    } as Partial<User>)
  }

  /** A member pinned to production whose grant is read-only. */
  async function makeReadOnlyProdUser() {
    const user = await makeUser({ role: 'admin', enableProdAccess: true, prodAccessMode: 'read' })
    await TeamMember.create({
      userId: user.id,
      role: 'member',
      enableProdAccess: true,
      prodAccessMode: 'read',
    } as Partial<TeamMember>)
    return user
  }

  function successes(action: string) {
    return AdminAction.query().where('action', action).where('outcome', 'success')
  }

  test('ban-user: a missing reason is refused before the org is looked up', async ({
    client,
    assert,
  }) => {
    const user = await makeUser()

    const response = await client
      .post('/api/v1/orgs/org-1/actions/ban-user')
      .json({ confirm: 'ban org-1' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(400)
    assert.equal(response.body().type, 'validation')
    assert.lengthOf(await successes('org.ban'), 0)
  })

  test('ban-user: the confirmation phrase is checked after the org lookup', async ({
    client,
    assert,
  }) => {
    const user = await makeUser()

    /**
     * Valid body, wrong phrase. The handler loads the org before comparing phrases, so
     * without a customer-database row this cannot reach the phrase check; what holds
     * regardless is that nothing succeeds and nothing is recorded.
     */
    const response = await client
      .post('/api/v1/orgs/org-1/actions/ban-user')
      .json({ reason: 'Chargeback abuse across several accounts', confirm: 'wrong phrase' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    assert.notEqual(response.status(), 200)
    assert.lengthOf(await successes('org.ban'), 0)
  })

  test('ban-user: a read-only production member is refused outright', async ({
    client,
    assert,
  }) => {
    const user = await makeReadOnlyProdUser()

    const response = await client
      .post('/api/v1/orgs/org-1/actions/ban-user')
      .json({ reason: 'Chargeback abuse across several accounts', confirm: 'ban org-1' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await successes('org.ban'), 0)
  })

  test('request-delete-custom-user: nothing is recorded without the org', async ({
    client,
    assert,
  }) => {
    const user = await makeUser()

    /** Phrase and reason are only checked once the org is loaded — see the group note. */
    const missingEverything = await client
      .post('/api/v1/orgs/org-1/actions/request-delete-custom-user')
      .json({})
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    assert.notEqual(missingEverything.status(), 200)
    assert.lengthOf(await successes('org.request_delete_user'), 0)
  })

  test('request-delete-custom-user: a read-only production member is refused', async ({
    client,
    assert,
  }) => {
    const user = await makeReadOnlyProdUser()

    const response = await client
      .post('/api/v1/orgs/org-1/actions/request-delete-custom-user')
      .json({ reason: 'Customer asked for full deletion', confirm: 'delete org-1' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await successes('org.request_delete_user'), 0)
  })

  test('backup deletion: nothing is recorded without the backup row', async ({
    client,
    assert,
  }) => {
    const user = await makeUser()

    /**
     * `DELETE /db-backups/:id` (an Inertia page route, not `/api/v1`) loads the backup
     * from the customer database before validating, so the missing reason and the wrong
     * phrase cannot be exercised here. Nothing must succeed either way.
     */
    const response = await client
      .delete('/db-backups/1')
      .json({ confirm: 'wrong phrase' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    assert.notEqual(response.status(), 200)
    assert.lengthOf(await successes('backup.delete'), 0)
  })

  test('backup deletion: a read-only production member is refused', async ({ client, assert }) => {
    const user = await makeReadOnlyProdUser()

    const response = await client
      .delete('/db-backups/1')
      .json({ reason: 'Superseded by a newer backup', confirm: 'delete backup' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await successes('backup.delete'), 0)
  })

  test('member removal: a wrong phrase is refused and nothing is recorded', async ({
    client,
    assert,
  }) => {
    const actor = await makeUser()
    const target = await makeUser({ role: 'admin' })
    const member = await TeamMember.create({
      userId: target.id,
      role: 'member',
      enableProdAccess: false,
    } as Partial<TeamMember>)

    const response = await client
      .delete(`/api/v1/members/${member.id}`)
      .json({ confirm: 'remove someone else', reason: 'Left the company last week' })
      .loginAs(actor)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(400)
    assert.equal(response.body().type, 'confirmation')
    assert.isNotNull(await TeamMember.find(member.id))
    assert.lengthOf(await successes('member.remove'), 0)
  })

  test('member removal: a missing or too-short reason is refused', async ({ client, assert }) => {
    const actor = await makeUser()
    const target = await makeUser({ role: 'admin' })
    const member = await TeamMember.create({
      userId: target.id,
      role: 'member',
      enableProdAccess: false,
    } as Partial<TeamMember>)
    const confirm = CONFIRMATION_PHRASES['member.remove'](target.email)

    for (const body of [{ confirm }, { confirm, reason: 'short' }]) {
      const response = await client
        .delete(`/api/v1/members/${member.id}`)
        .json(body)
        .loginAs(actor)
        .withCsrfToken()
        .redirects(0)

      response.assertStatus(400)
    }

    assert.isNotNull(await TeamMember.find(member.id))
    assert.lengthOf(await successes('member.remove'), 0)
  })

  test('member removal: the right phrase and a reason succeed and are recorded', async ({
    client,
    assert,
  }) => {
    const actor = await makeUser()
    const target = await makeUser({ role: 'admin' })
    const member = await TeamMember.create({
      userId: target.id,
      role: 'member',
      enableProdAccess: false,
    } as Partial<TeamMember>)

    const response = await client
      .delete(`/api/v1/members/${member.id}`)
      .json({
        confirm: CONFIRMATION_PHRASES['member.remove'](target.email).toUpperCase(),
        reason: 'Left the company last week',
      })
      .loginAs(actor)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(200)
    assert.isNull(await TeamMember.find(member.id))

    const rows = await successes('member.remove')
    assert.lengthOf(rows, 1)
    assert.equal(rows[0].reason, 'Left the company last week')
    assert.equal(rows[0].targetId, member.id)
    assert.equal(rows[0].actorId, actor.id)
  })

  test('bulk favourite: an empty selection is refused before any org is loaded', async ({
    client,
    assert,
  }) => {
    const user = await makeUser()

    for (const body of [{}, { orgIds: [] }]) {
      const response = await client
        .post('/api/v1/orgs/actions/bulk-make-favourite')
        .json(body)
        .loginAs(user)
        .withCsrfToken()
        .redirects(0)

      response.assertStatus(400)
      assert.equal(response.body().type, 'validation')
    }

    assert.lengthOf(await successes('org.bulk_favourite'), 0)
  })

  test('bulk favourite: the phrase is checked after the org lookup', async ({ client, assert }) => {
    const user = await makeUser()

    /**
     * `reason` is optional in `bulkOrgIdsValidator` and never checked with
     * `reasonIsValid`, and the phrase is compared only after the orgs are counted, so
     * neither refusal can be observed without customer-database rows.
     */
    const response = await client
      .post('/api/v1/orgs/actions/bulk-make-favourite')
      .json({ orgIds: ['org-1'], confirm: 'apply to 999' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    assert.notEqual(response.status(), 200)
    assert.lengthOf(await successes('org.bulk_favourite'), 0)
  })

  test('bulk favourite: a read-only production member is refused', async ({ client, assert }) => {
    const user = await makeReadOnlyProdUser()

    const response = await client
      .post('/api/v1/orgs/actions/bulk-make-favourite')
      .json({ orgIds: ['org-1'], confirm: 'apply to 1', reason: 'Tidying the favourites' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
    assert.lengthOf(await successes('org.bulk_favourite'), 0)
  })
})
