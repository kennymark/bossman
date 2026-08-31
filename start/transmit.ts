import transmit from '@adonisjs/transmit/services/main'

/**
 * Channel authorization for Transmit.
 *
 * `transmit.registerRoutes()` was called with no `authorize()` rules at all, so any
 * client — including an unauthenticated one — could subscribe to
 * `notifications/<any user id>` and receive that admin's notification stream live.
 *
 * Registered here rather than in `start/routes.ts` so the rules exist before the
 * routes that consume them.
 */
transmit.authorize<{ id: string }>('notifications/:id', (ctx, { id }) => {
  /**
   * `silent_auth_middleware` used to skip `/__transmit` entirely, which left
   * `ctx.auth.user` undefined here. It no longer does — see the note in that file.
   */
  const user = ctx.auth?.user
  if (!user) return false

  /** A user may only ever subscribe to their own stream. */
  return user.id === id
})
