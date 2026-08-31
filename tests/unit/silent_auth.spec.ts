import { test } from '@japa/runner'

import SilentAuthMiddleware from '#middleware/silent_auth_middleware'

/**
 * Silent auth must resolve the session on **every** request.
 *
 * It used to carry a skip-list — `/admin/api/server-stats` and `/__transmit` — to avoid
 * a user lookup on polling routes. Both features resolve access from `ctx.auth.user`,
 * so skipping the check left their guards looking at an anonymous request: the stats
 * endpoint denied every caller including god admins, and the Transmit channel rules had
 * no user to authorize against. These cases stop the skip-list coming back.
 */
test.group('SilentAuthMiddleware', () => {
  /** Minimal ctx double: records whether `auth.check()` was reached. */
  function fakeCtx(url: string) {
    let checked = false
    return {
      ctx: {
        request: { url: () => url },
        auth: {
          check: async () => {
            checked = true
            return false
          },
        },
      },
      wasChecked: () => checked,
    }
  }

  const PATHS = [
    '/admin/api/server-stats',
    '/admin/api/server-stats?since=123',
    '/__transmit/subscribe',
    '/__transmit/events',
    '/admin/api/debug',
    '/dashboard',
    '/api/v1/orgs',
    '/',
  ]

  for (const path of PATHS) {
    test(`resolves auth for ${path}`, async ({ assert }) => {
      const { ctx, wasChecked } = fakeCtx(path)
      let nextCalled = false

      await new SilentAuthMiddleware().handle(ctx as never, async () => {
        nextCalled = true
      })

      assert.isTrue(wasChecked(), `auth.check() must run for ${path}`)
      assert.isTrue(nextCalled, 'the request must continue')
    })
  }

  test('an anonymous request still continues rather than failing', async ({ assert }) => {
    const { ctx } = fakeCtx('/dashboard')
    let nextCalled = false

    await new SilentAuthMiddleware().handle(ctx as never, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })
})
