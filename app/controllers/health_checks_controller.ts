import type { HttpContext } from '@adonisjs/core/http'

import env from '#start/env'
import { healthChecks } from '#start/health'

export default class HealthChecksController {
  /**
   * The full report names every database connection and reports disk and memory
   * headroom, so it is only returned to a monitoring system holding the shared secret
   * or to a signed-in admin. Everyone else gets liveness only, which keeps load
   * balancer and container probes working without disclosing internals.
   */
  async handle({ request, response, auth }: HttpContext) {
    const report = await healthChecks.run()
    const status = report.isHealthy ? 200 : 503

    const secret = env.get('HEALTH_CHECK_SECRET')
    const presented = request.header('x-monitoring-secret')
    const hasSecret = Boolean(secret) && presented === secret

    if (hasSecret || auth.user?.isAdminOrSuperAdmin) {
      return response.status(status).send(report)
    }

    return response.status(status).send({ isHealthy: report.isHealthy })
  }
}
