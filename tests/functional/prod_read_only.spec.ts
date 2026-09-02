import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import TeamMember from '#models/team_member'
import User from '#models/user'
import { PROD_READ_ONLY_ERROR } from '#utils/prod_access'

/**
 * A read-only production grant lets a member look at live customer data and nothing
 * more. The gate is `prod_read_only_middleware`, which runs on every routed request.
 *
 * `POST /api/v1/orgs/actions/bulk-preview` is the probe: it validates its body before
 * touching a customer database, so a caller who is *not* blocked gets a 400 validation
 * error from an empty body, and a blocked caller gets a 403 — no customer-data table
 * is needed to tell the two apart.
 */
test.group('Read-only production access', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function makeUser(attrs: Partial<User> = {}) {
    return User.create({
      fullName: 'Test User',
      email: `${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123',
      role: 'admin',
      isGodAdmin: false,
      enableProdAccess: true,
      prodAccessMode: 'write',
      emailVerified: true,
      ...attrs,
    } as Partial<User>)
  }

  function makeMember(userId: string, attrs: Partial<TeamMember> = {}) {
    return TeamMember.create({
      userId,
      role: 'member',
      enableProdAccess: true,
      prodAccessMode: 'write',
      ...attrs,
    } as Partial<TeamMember>)
  }

  const PROBE = '/api/v1/orgs/actions/bulk-preview'

  test('refuses a production write from a read-only member', async ({ client, assert }) => {
    const user = await makeUser({ prodAccessMode: 'read' })
    await makeMember(user.id, { prodAccessMode: 'read' })

    const response = await client.post(PROBE).json({}).loginAs(user).withCsrfToken().redirects(0)

    response.assertStatus(403)
    assert.equal(response.body().error, PROD_READ_ONLY_ERROR)
  })

  test('lets the same request from a read & write member reach validation', async ({
    client,
    assert,
  }) => {
    const user = await makeUser({ prodAccessMode: 'write' })
    await makeMember(user.id, { prodAccessMode: 'write' })

    const response = await client.post(PROBE).json({}).loginAs(user).withCsrfToken().redirects(0)

    /** The handler validated the empty body: it was not blocked. */
    response.assertStatus(400)
    assert.equal(response.body().type, 'validation')
  })

  test('takes the stricter of the user and team member records', async ({ client }) => {
    const userSaysRead = await makeUser({ prodAccessMode: 'read' })
    await makeMember(userSaysRead.id, { prodAccessMode: 'write' })

    const memberSaysRead = await makeUser({ prodAccessMode: 'write' })
    await makeMember(memberSaysRead.id, { prodAccessMode: 'read' })

    for (const user of [userSaysRead, memberSaysRead]) {
      const response = await client.post(PROBE).json({}).loginAs(user).withCsrfToken().redirects(0)

      response.assertStatus(403)
    }
  })

  test('still lets a read-only member read production', async ({ client, assert }) => {
    const user = await makeUser({ prodAccessMode: 'read' })
    await makeMember(user.id, { prodAccessMode: 'read' })

    /** A GET under a gated key; it reads the admin database so it can answer here. */
    const response = await client.get('/api/v1/db-backups/health').loginAs(user).redirects(0)

    assert.notEqual(response.status(), 403)
    assert.notEqual(response.status(), 401)
  })

  test('leaves admin-only pages writable for a read-only member', async ({ client }) => {
    const user = await makeUser({ prodAccessMode: 'read' })
    const member = await makeMember(user.id, { prodAccessMode: 'read' })

    /** `teams` is not a customer-data page, so the write goes through. */
    const response = await client
      .put(`/api/v1/members/${member.id}`)
      .json({})
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(200)
  })

  test('does not restrict a read-only member who is pinned to dev', async ({ client, assert }) => {
    const user = await makeUser({ enableProdAccess: false, prodAccessMode: 'read' })
    await makeMember(user.id, { enableProdAccess: false, prodAccessMode: 'read' })

    const response = await client.post(PROBE).json({}).loginAs(user).withCsrfToken().redirects(0)

    response.assertStatus(400)
    assert.equal(response.body().type, 'validation')
  })

  test('never restricts a god admin, whatever the stored mode', async ({ client, assert }) => {
    const user = await makeUser({ isGodAdmin: true, role: 'super_admin', prodAccessMode: 'read' })
    await makeMember(user.id, { role: 'owner', prodAccessMode: 'read' })

    const response = await client
      .post(PROBE)
      .json({})
      .loginAs(user)
      .withSession({ appEnv: 'prod' })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(400)
    assert.equal(response.body().type, 'validation')
  })
})

/**
 * Granting or changing the mode goes through `PUT /api/v1/members/:memberId`. It is a
 * god-admin decision with a reason, and the change is written to `admin_actions`.
 */
test.group('Production access mode grants', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function makeUser(attrs: Partial<User> = {}) {
    return User.create({
      fullName: 'Test User',
      email: `${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123',
      role: 'admin',
      isGodAdmin: false,
      enableProdAccess: false,
      prodAccessMode: 'write',
      emailVerified: true,
      ...attrs,
    } as Partial<User>)
  }

  test('a god admin can grant read-only access with a reason', async ({ client, assert }) => {
    const { default: AdminAction } = await import('#models/admin_action')
    const god = await makeUser({ isGodAdmin: true, role: 'super_admin' })
    const target = await makeUser()
    const member = await TeamMember.create({
      userId: target.id,
      role: 'member',
      enableProdAccess: false,
      prodAccessMode: 'write',
    } as Partial<TeamMember>)

    const response = await client
      .put(`/api/v1/members/${member.id}`)
      .json({
        enableProdAccess: true,
        prodAccessMode: 'read',
        prodAccessReason: 'Investigating billing incident #482',
      })
      .loginAs(god)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(200)

    await member.refresh()
    await target.refresh()
    assert.equal(member.prodAccessMode, 'read')
    assert.isTrue(member.enableProdAccess)
    /** Synced so the middleware can read it off the user without a second query. */
    assert.equal(target.prodAccessMode, 'read')

    const grant = await AdminAction.query()
      .where('action', 'member.prod_access_grant')
      .where('targetId', member.id)
      .firstOrFail()
    assert.equal(grant.metadata?.mode, 'read')
  })

  test('changing the mode alone needs a reason and is recorded', async ({ client, assert }) => {
    const { default: AdminAction } = await import('#models/admin_action')
    const god = await makeUser({ isGodAdmin: true, role: 'super_admin' })
    const target = await makeUser({ enableProdAccess: true, prodAccessMode: 'read' })
    const member = await TeamMember.create({
      userId: target.id,
      role: 'member',
      enableProdAccess: true,
      prodAccessMode: 'read',
    } as Partial<TeamMember>)

    const withoutReason = await client
      .put(`/api/v1/members/${member.id}`)
      .json({ prodAccessMode: 'write' })
      .loginAs(god)
      .withCsrfToken()
      .redirects(0)

    withoutReason.assertStatus(400)
    await member.refresh()
    assert.equal(member.prodAccessMode, 'read')

    const withReason = await client
      .put(`/api/v1/members/${member.id}`)
      .json({ prodAccessMode: 'write', prodAccessReason: 'Needs to apply the refund' })
      .loginAs(god)
      .withCsrfToken()
      .redirects(0)

    withReason.assertStatus(200)
    await member.refresh()
    await target.refresh()
    assert.equal(member.prodAccessMode, 'write')
    assert.equal(target.prodAccessMode, 'write')

    const row = await AdminAction.query()
      .where('action', 'member.prod_access_mode')
      .where('targetId', member.id)
      .firstOrFail()
    assert.equal(row.reason, 'Needs to apply the refund')
    assert.deepEqual(row.metadata, { from: 'read', to: 'write' })
  })

  test('only a god admin may change the mode', async ({ client, assert }) => {
    const admin = await makeUser({ role: 'super_admin' })
    const target = await makeUser({ enableProdAccess: true, prodAccessMode: 'read' })
    const member = await TeamMember.create({
      userId: target.id,
      role: 'member',
      enableProdAccess: true,
      prodAccessMode: 'read',
    } as Partial<TeamMember>)

    const response = await client
      .put(`/api/v1/members/${member.id}`)
      .json({ prodAccessMode: 'write', prodAccessReason: 'Trying to widen my own team' })
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
    await member.refresh()
    assert.equal(member.prodAccessMode, 'read')
  })

  test('rejects a mode outside the enum', async ({ client }) => {
    const god = await makeUser({ isGodAdmin: true, role: 'super_admin' })
    const target = await makeUser()
    const member = await TeamMember.create({
      userId: target.id,
      role: 'member',
      enableProdAccess: false,
    } as Partial<TeamMember>)

    const response = await client
      .put(`/api/v1/members/${member.id}`)
      .json({ prodAccessMode: 'admin', prodAccessReason: 'Should never be accepted' })
      .loginAs(god)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(400)
  })
})
