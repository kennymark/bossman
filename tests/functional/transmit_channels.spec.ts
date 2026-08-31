import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import User from '#models/user'

/**
 * Transmit channel authorization.
 *
 * `transmit.registerRoutes()` was called with no `authorize()` rules at all, so any
 * client — including an unauthenticated one — could subscribe to
 * `notifications/<any user id>` and read another admin's notification stream in real
 * time. `silent_auth_middleware` also skipped `/__transmit`, so there was no user to
 * authorize against even if a rule had existed.
 */
test.group('Transmit channel authorization', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    group.each.setup(() => testUtils.db().wrapInGlobalTransaction())
  })

  /** `loginAs` lives on the request, not the client. */
  function subscribe(client: any, channel: string, as?: User) {
    const request = client
      .post('/__transmit/subscribe')
      .json({ channel, uid: 'test-connection-uid' })
      .withCsrfToken()

    return as ? request.loginAs(as) : request
  }

  test('an anonymous client cannot subscribe to a user channel', async ({ client, assert }) => {
    const response = await subscribe(client, 'notifications/some-user-id')
    assert.notEqual(response.status(), 204)
    assert.isAbove(response.status(), 399)
  })

  test('a signed-in user cannot subscribe to another user channel', async ({ client, assert }) => {
    const [alice, bob] = await Promise.all([
      User.create({
        fullName: 'Alice',
        email: 'alice-transmit@example.com',
        password: 'password123',
        role: 'admin',
      }),
      User.create({
        fullName: 'Bob',
        email: 'bob-transmit@example.com',
        password: 'password123',
        role: 'admin',
      }),
    ])

    const response = await subscribe(client, `notifications/${bob.id}`, alice)

    assert.notEqual(response.status(), 204)
    assert.isAbove(response.status(), 399)
  })

  test('a signed-in user can subscribe to their own channel', async ({ client, assert }) => {
    const alice = await User.create({
      fullName: 'Alice',
      email: 'alice-own@example.com',
      password: 'password123',
      role: 'admin',
    })

    const response = await subscribe(client, `notifications/${alice.id}`, alice)

    assert.isBelow(response.status(), 400)
  })
})
