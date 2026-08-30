import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

import apiAccessService from '#services/api_access_service'

/**
 * Togetha Connect oversight: which applications are connected, how many access
 * tokens exist, what they are allowed to do, and which workspaces they reach.
 *
 * Tokens authenticate both the Togetha REST API and the MCP server, so this is
 * the one place to see the whole API surface's usage.
 */
export default class ApiAccessController {
  async index({ inertia }: HttpContext) {
    return inertia.render('api-access/index', {})
  }

  /**
   * Everything the page renders, for the currently selected environment.
   */
  async stats({ request, response }: HttpContext) {
    const appEnv = request.appEnv()

    try {
      const [totals, byApplication, byScope, connectedOrgs, recent] = await Promise.all([
        apiAccessService.totals(appEnv),
        apiAccessService.byApplication(appEnv),
        apiAccessService.byScope(appEnv),
        apiAccessService.connectedOrgs(appEnv),
        apiAccessService.recent(appEnv),
      ])

      return response.ok({
        totals: { ...totals, applications: byApplication.length, connectedOrgs },
        byApplication,
        byScope,
        recent,
      })
    } catch (error) {
      logger.error({ err: error, appEnv }, 'Failed to load API access stats')

      return response.ok({
        /**
         * An environment that has not been migrated yet simply has no token
         * table. Report that as empty rather than failing the page.
         */
        totals: {
          total: 0,
          active: 0,
          expired: 0,
          usedLast7Days: 0,
          createdLast30Days: 0,
          users: 0,
          applications: 0,
          connectedOrgs: 0,
        },
        byApplication: [],
        byScope: [],
        recent: [],
        unavailable: true,
      })
    }
  }
}
