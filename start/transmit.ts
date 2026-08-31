import transmit from '@adonisjs/transmit/services/main'

/**
 * Channel authorization for Transmit.
 *
 * `transmit.registerRoutes()` was called with no `authorize()` rules at all, and
 * Transmit allows any channel that has no rule — so every stream the app broadcasts on
 * was readable by anyone who knew the channel name, including unauthenticated clients.
 *
 * Registered here rather than in `start/routes.ts` so the rules exist before the routes
 * that consume them. Any new `transmit.broadcast()` target needs a rule added here.
 */

/** Matches the `authorize` guard in `config/server_stats.ts`, so both doors use one lock. */
const isGodAdmin = (ctx: { auth?: { user?: { isGodAdmin?: boolean } } }) =>
  Boolean(ctx.auth?.user?.isGodAdmin)

/**
 * `adonisjs-server-stats` broadcasts on these whenever `@adonisjs/transmit` is
 * resolvable — independent of its own `realtime` flag — and registers no guards of its
 * own, so the dashboard metrics stream was public.
 */
transmit.authorize('server-stats/dashboard', isGodAdmin)
transmit.authorize('server-stats/debug', isGodAdmin)

/** A user may only ever subscribe to their own notification stream. */
transmit.authorize<{ id: string }>('notifications/:id', (ctx, { id }) => {
  /**
   * `silent_auth_middleware` used to skip `/__transmit` entirely, which left
   * `ctx.auth.user` undefined here. It no longer does — see the note in that file.
   */
  const user = ctx.auth?.user
  if (!user) return false

  return user.id === id
})
