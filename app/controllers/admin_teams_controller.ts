import type { HttpContext } from '@adonisjs/core/http'

export default class AdminTeamsController {
  async index({ inertia }: HttpContext) {
    return inertia.render('admin/teams')
  }
}

