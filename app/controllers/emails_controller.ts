import type { HttpContext } from '@adonisjs/core/http'

import { resendService } from '#services/resend_service'
import { emailsListValidator } from '#validators/query'

/** Admin role and the `emails` page grant are enforced by the route group. */
export default class EmailsController {
  /**
   * List sent emails (cursor-based pagination).
   * Query: limit (1–100), after (id), before (id).
   */
  async index({ request, response }: HttpContext) {
    await request.validateUsing(emailsListValidator)
    const limit = Math.min(Math.max(Number(request.qs().limit) || 20, 1), 100)
    const after = request.qs().after as string | undefined
    const before = request.qs().before as string | undefined

    const list = await resendService.list({
      limit,
      ...(after && { after }),
      ...(before && { before }),
    })

    return response.ok(list)
  }

  /**
   * Get a single email by id (includes html/text).
   */
  async show({ params, response }: HttpContext) {
    const email = await resendService.get(params.id)
    return response.ok(email)
  }
}
