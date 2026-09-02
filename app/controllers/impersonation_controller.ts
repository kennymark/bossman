import type { HttpContext } from '@adonisjs/core/http'

/** Scaffold: implemented by the feature branch that owns it. */
export default class ImpersonationController {
  async targets({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async create({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }
}
