import type { HttpContext } from '@adonisjs/core/http'

/** Admin role and the `emails` page grant are enforced by the route group. */
export default class EmailsPageController {
  async index({ inertia }: HttpContext) {
    return inertia.render('emails/index', {})
  }

  async show({ params, inertia }: HttpContext) {
    return inertia.render('emails/index', { emailId: params.id })
  }
}
