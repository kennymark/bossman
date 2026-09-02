import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { getTeamMemberForRequest } from '#services/prod_access_service'
import { isProdWriteBlocked, PROD_READ_ONLY_ERROR } from '#utils/prod_access'

/**
 * Refuses production writes from members whose grant is read-only.
 *
 * Runs after `app_env_middleware`, so `request.appEnv()` is already authoritative, and
 * before the route-level guards. It only ever narrows access: a request it lets
 * through still has to pass `auth`, `appRole` and `pageAccess`. The team member row is
 * fetched only when every cheaper condition already points at a block.
 */
export default class ProdReadOnlyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth?.user
    if (!user || user.isGodAdmin) return next()

    const check = {
      method: ctx.request.method(),
      path: ctx.request.url(),
      appEnv: ctx.request.appEnv(),
    }

    /**
     * Cheap pass first: most requests are reads, on dev, or on admin-only pages, and
     * none of those can be blocked whatever the mode turns out to be.
     */
    const wouldBlockIfRead = isProdWriteBlocked({
      ...check,
      user: { isGodAdmin: false, prodAccessMode: 'read' },
    })
    if (!wouldBlockIfRead) return next()

    const member = await getTeamMemberForRequest(ctx)
    const blocked = isProdWriteBlocked({
      ...check,
      user: { isGodAdmin: user.isGodAdmin, prodAccessMode: user.prodAccessMode },
      member: member ? { prodAccessMode: member.prodAccessMode } : null,
    })
    if (!blocked) return next()

    return ctx.response.forbidden({ error: PROD_READ_ONLY_ERROR, type: 'prod_read_only' })
  }
}
