import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Silent auth middleware can be used as a global middleware to silent check
 * if the user is logged-in or not.
 *
 * The request continues as usual, even when the user is not logged-in.
 *
 * **Do not reintroduce a path skip-list here.** This used to skip
 * `/admin/api/server-stats` and `/__transmit` to avoid a user lookup on polling
 * routes, which broke both of them: each resolves access from `ctx.auth.user`, so
 * skipping the check left their guards looking at an anonymous request and denying
 * every caller. The cost this was avoiding is one cached session lookup per poll.
 *
 * The session-churn concern that motivated it is handled at the source — server-stats
 * strips `Set-Cookie` from its own routes (`no_session_middleware`), so polling does
 * not accumulate cookies whether or not auth runs.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()

    return next()
  }
}
