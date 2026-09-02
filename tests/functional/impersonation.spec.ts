import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import User from '#models/user'
import env from '#start/env'

/**
 * The handler reads the org and the target from the Togetha databases, which the test
 * database does not carry, so these cases stop at the gates that come before that:
 * authorization, configuration, validation. `IMPERSONATION_SECRET` is read at boot, so
 * the configured/unconfigured halves run depending on how the suite was started.
 */
test.group('Impersonation API', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const configured = Boolean(env.get('IMPERSONATION_SECRET'))

  function makeUser(attrs: Partial<User> = {}) {
    return User.create({
      fullName: 'Test User',
      email: `${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123',
      role: 'super_admin',
      isGodAdmin: false,
      enableProdAccess: false,
      emailVerified: true,
      ...attrs,
    } as Partial<User>)
  }

  test('rejects an anonymous caller', async ({ client }) => {
    const response = await client
      .get('/api/v1/orgs/org_1/impersonation-targets')
      .accept('json')
      .redirects(0)

    response.assertStatus(401)
  })

  test('rejects a signed-in non-admin', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    const response = await client
      .post('/api/v1/orgs/org_1/actions/impersonate')
      .json({ userId: 'user_1', reason: 'Looking into a support ticket', confirmation: 'x' })
      .accept('json')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
  })

  test('answers 503 when no secret is configured', async ({ client }) => {
    const user = await makeUser()

    const response = await client
      .post('/api/v1/orgs/org_1/actions/impersonate')
      .json({ userId: 'user_1', reason: 'Looking into a support ticket', confirmation: 'x' })
      .accept('json')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(503)
    response.assertBodyContains({ error: 'Impersonation is not configured' })
  }).skip(configured, 'IMPERSONATION_SECRET is set for this run')

  test('validates the body before touching customer data', async ({ client }) => {
    const user = await makeUser()

    const response = await client
      .post('/api/v1/orgs/org_1/actions/impersonate')
      .json({})
      .accept('json')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    /** This app answers validation failures with 400 and a `validation` type. */
    response.assertStatus(400)
    response.assertBodyContains({ type: 'validation' })
  }).skip(!configured, 'needs IMPERSONATION_SECRET')

  test('rejects a reason that says nothing', async ({ client }) => {
    const user = await makeUser()

    const response = await client
      .post('/api/v1/orgs/org_1/actions/impersonate')
      .json({ userId: 'user_1', reason: 'short', confirmation: 'impersonate x' })
      .accept('json')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(400)
    response.assertBodyContains({ error: 'A reason of at least 8 characters is required.' })
  }).skip(!configured, 'needs IMPERSONATION_SECRET')
})
