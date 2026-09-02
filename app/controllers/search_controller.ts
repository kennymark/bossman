import type { HttpContext } from '@adonisjs/core/http'

/** Scaffold: implemented by the feature branch that owns it. */
export default class SearchController {
  async index({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }
}
