import type { HttpContext } from '@adonisjs/core/http'

/** Scaffold: implemented by the feature branch that owns it. */
export default class MaintenanceController {
  async index({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async show({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async stats({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async export({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async byOrg({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }
}
