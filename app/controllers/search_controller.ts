import type { HttpContext } from '@adonisjs/core/http'

import GlobalSearchService from '#services/global_search_service'
import { getPageAccessForRequest } from '#services/page_access_service'
import { filterSearchGroupsByPageAccess, parseSearchGroups } from '#utils/search'
import { searchValidator } from '#validators/search'

/**
 * Record search for the header search field.
 *
 * `/api/v1/search` names no page, so the route group's `pageAccess` gate lets every
 * admin through. The groups are filtered here against the caller's grants instead: a
 * member restricted to leases must not learn organisation names from a search box.
 */
export default class SearchController {
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const payload = await request.validateUsing(searchValidator)

    const allowedPages = await getPageAccessForRequest(ctx)
    const groups = filterSearchGroupsByPageAccess(parseSearchGroups(payload.groups), allowedPages)

    const results = await GlobalSearchService.search({
      appEnv: request.appEnv(),
      query: payload.q,
      groups,
      includeTest: payload.includeTest,
    })

    return response.ok({ query: payload.q, groups, results })
  }
}
