import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

import { recordAdminAction } from '#services/admin_audit_service'
import jobMonitor, {
  JobMonitorNotConfiguredError,
  JobNotFoundError,
} from '#services/job_monitor_service'
import type { AppEnv } from '#types/env'
import { CONFIRMATION_PHRASES, confirmationMatches, reasonIsValid } from '#utils/confirmation'
import { renderInertia } from '#utils/inertia'
import { isJobId } from '#utils/jobs'
import {
  destroyJobValidator,
  historyJobsValidator,
  listJobsValidator,
  rerunJobValidator,
} from '#validators/jobs'

const STORE_UNREACHABLE = 'The job store could not be reached. Try again shortly.'

/**
 * The Pulse/Agenda job monitor.
 *
 * Reads the product's job store for whichever environment the session resolved to.
 * The environment always comes from `request.appEnv()`; a store that is not
 * configured for it answers 503 with a plain explanation, and one that cannot be
 * reached answers 503 without saying why — the reason goes to the log.
 *
 * Re-running and deleting touch what the product will execute next, so both need a
 * reason, both are recorded, and in production both are reserved for god admins.
 */
export default class JobsController {
  async index({ inertia }: HttpContext) {
    return renderInertia(inertia, 'jobs/index', {})
  }

  /** The page fetches the job itself; an unknown or malformed id surfaces as its 404. */
  async show({ inertia, params }: HttpContext) {
    return renderInertia(inertia, 'jobs/show', { jobId: String(params.id ?? '') })
  }

  async status({ request, response }: HttpContext) {
    const appEnv = request.appEnv()
    return response.ok({ env: appEnv, configured: jobMonitor.isConfigured(appEnv) })
  }

  async stats(ctx: HttpContext) {
    const appEnv = ctx.request.appEnv()
    return this.serve(ctx, appEnv, async () => ctx.response.ok(await jobMonitor.stats(appEnv)))
  }

  async list(ctx: HttpContext) {
    const { request, response } = ctx
    const appEnv = request.appEnv()
    const query = await request.validateUsing(listJobsValidator)

    return this.serve(ctx, appEnv, async () => response.ok(await jobMonitor.list(appEnv, query)))
  }

  async history(ctx: HttpContext) {
    const { request, response } = ctx
    const appEnv = request.appEnv()
    const query = await request.validateUsing(historyJobsValidator)

    return this.serve(ctx, appEnv, async () => response.ok(await jobMonitor.history(appEnv, query)))
  }

  async detail(ctx: HttpContext) {
    const { request, response, params } = ctx
    const appEnv = request.appEnv()
    const id = String(params.id ?? '')
    if (!isJobId(id)) return response.notFound({ error: 'Job not found' })

    return this.serve(ctx, appEnv, async () => response.ok(await jobMonitor.detail(appEnv, id)))
  }

  async rerun(ctx: HttpContext) {
    const { request, response, params } = ctx
    const appEnv = request.appEnv()
    const id = String(params.id ?? '')
    const { reason } = await request.validateUsing(rerunJobValidator)

    if (!isJobId(id)) return response.notFound({ error: 'Job not found' })
    if (!reasonIsValid(reason)) {
      return response.badRequest({ error: 'A reason of at least 8 characters is required.' })
    }
    if (!this.canMutate(ctx, appEnv)) {
      return response.forbidden({ error: 'Only a god admin can re-run jobs in production.' })
    }

    return this.serve(ctx, appEnv, async () => {
      const result = await jobMonitor.rerun(appEnv, id)

      await recordAdminAction(ctx, {
        action: 'job.rerun',
        appEnv,
        targetType: 'Job',
        targetId: id,
        targetLabel: result.name,
        reason,
        metadata: { previousJobId: result.previousJobId, newJobId: result.newJobId },
      })

      return response.ok({ message: `Re-queued ${result.name}`, ...result })
    })
  }

  async destroy(ctx: HttpContext) {
    const { request, response, params } = ctx
    const appEnv = request.appEnv()
    const id = String(params.id ?? '')
    const { reason, confirmation } = await request.validateUsing(destroyJobValidator)

    if (!isJobId(id)) return response.notFound({ error: 'Job not found' })
    if (!reasonIsValid(reason)) {
      return response.badRequest({ error: 'A reason of at least 8 characters is required.' })
    }
    if (!this.canMutate(ctx, appEnv)) {
      return response.forbidden({ error: 'Only a god admin can delete jobs in production.' })
    }

    return this.serve(ctx, appEnv, async () => {
      const job = await jobMonitor.detail(appEnv, id)

      /**
       * The phrase names the job, so the dialog for one row cannot confirm another.
       * Checked here, not only in the dialog.
       */
      const expected = CONFIRMATION_PHRASES['job.delete'](job.name)
      if (!confirmationMatches(confirmation, expected)) {
        return response.badRequest({
          error: `Type "${expected}" to confirm this deletion.`,
          type: 'confirmation',
        })
      }

      const removed = await jobMonitor.remove(appEnv, id)

      await recordAdminAction(ctx, {
        action: 'job.delete',
        appEnv,
        targetType: 'Job',
        targetId: id,
        targetLabel: removed.name,
        reason,
        metadata: {
          name: removed.name,
          status: removed.status,
          repeatInterval: removed.repeatInterval,
          nextRunAt: removed.nextRunAt,
          failCount: removed.failCount,
        },
      })

      return response.ok({ message: `Deleted ${removed.name}`, id, name: removed.name })
    })
  }

  /** Production mutations are god-admin only; the route grant covers everything else. */
  private canMutate({ auth }: HttpContext, appEnv: AppEnv): boolean {
    return appEnv !== 'prod' || Boolean(auth.user?.isGodAdmin)
  }

  /**
   * Runs a store operation and maps its failures onto responses.
   *
   * Nothing from the driver reaches the client: a missing configuration is spelled
   * out, a missing job is a 404, and anything else is logged and answered generically.
   */
  private async serve<T>(ctx: HttpContext, appEnv: AppEnv, handler: () => Promise<T>) {
    try {
      return await handler()
    } catch (error) {
      if (error instanceof JobMonitorNotConfiguredError) {
        return ctx.response.serviceUnavailable({ error: error.message })
      }
      if (error instanceof JobNotFoundError) {
        return ctx.response.notFound({ error: 'Job not found' })
      }

      logger.error({ err: error, appEnv, url: ctx.request.url() }, 'Job monitor request failed')
      return ctx.response.serviceUnavailable({ error: STORE_UNREACHABLE })
    }
  }
}
