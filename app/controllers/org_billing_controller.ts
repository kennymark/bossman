import type { HttpContext } from '@adonisjs/core/http'

/** Scaffold: implemented by the feature branch that owns it. */
export default class OrgBillingController {
  async subscription({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async invoices({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async plan({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async plans({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async featureFlags({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async updateFeatureFlags({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }

  async resetFeatureFlags({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }
}
