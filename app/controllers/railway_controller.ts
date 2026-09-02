import type { HttpContext } from '@adonisjs/core/http'

import { recordAdminAction } from '#services/admin_audit_service'
import { RailwayApiService } from '#services/railway_service'
import {
  railwayActionValidator,
  railwayDeploymentsValidator,
  railwayFreshValidator,
  railwayServiceDeployValidator,
} from '#validators/query'

/** `?refresh=1` bypasses the cache for this one read and refills it. */
function wantsFresh(ctx: HttpContext): boolean {
  const value = ctx.request.qs().refresh
  return value === '1' || value === 'true'
}

/** Admin role and the `servers` page grant are enforced by the route group. */
export default class RailwayController {
  async projects(ctx: HttpContext) {
    await ctx.request.validateUsing(railwayFreshValidator)
    const service = new RailwayApiService()
    try {
      const projects = await service.listProjects({ forceFresh: wantsFresh(ctx) })
      return ctx.response.ok(projects)
    } catch (err) {
      return ctx.response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to fetch Railway projects',
      })
    }
  }

  async project(ctx: HttpContext) {
    const { params, response } = ctx
    const service = new RailwayApiService()
    try {
      const project = await service.getProject(params.id, { forceFresh: wantsFresh(ctx) })
      if (!project) return response.notFound({ message: 'Project not found' })
      return response.ok(project)
    } catch (err) {
      return response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to fetch Railway project',
      })
    }
  }

  async deployments(ctx: HttpContext) {
    const { params, request, response } = ctx
    const { environmentId, projectId = '' } = await request.validateUsing(
      railwayDeploymentsValidator,
    )
    if (!environmentId) {
      return response.badRequest({ message: 'environmentId is required' })
    }
    const service = new RailwayApiService()
    try {
      const deployments = await service.getDeployments(
        projectId,
        params.serviceId,
        environmentId,
        5,
        { forceFresh: wantsFresh(ctx) },
      )
      return response.ok(deployments)
    } catch (err) {
      return response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to fetch deployments',
      })
    }
  }

  /**
   * Logs are deliberately never cached — they are a live tail, and a stale one is
   * worse than a slow one.
   */
  async deploymentLogs(ctx: HttpContext) {
    const { params, response } = ctx
    const service = new RailwayApiService()
    try {
      const logs = await service.getDeploymentRuntimeLogs(params.id)
      return response.ok(logs)
    } catch (err) {
      return response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to fetch deployment logs',
      })
    }
  }

  async deploymentBuildLogs(ctx: HttpContext) {
    const { params, response } = ctx
    const service = new RailwayApiService()
    try {
      const logs = await service.getDeploymentBuildLogs(params.id)
      return response.ok(logs)
    } catch (err) {
      return response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to fetch build logs',
      })
    }
  }

  async deploymentRestart(ctx: HttpContext) {
    const { params, response } = ctx
    await ctx.request.validateUsing(railwayActionValidator)
    const service = new RailwayApiService()
    try {
      await service.deploymentRestart(params.id)

      await recordAdminAction(ctx, {
        action: 'server.restart',
        targetType: 'RailwayDeployment',
        targetId: params.id,
        reason: ctx.request.input('reason') ?? null,
      })

      return response.ok({ success: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restart deployment'
      await recordAdminAction(ctx, {
        action: 'server.restart',
        targetType: 'RailwayDeployment',
        targetId: params.id,
        outcome: 'failed',
        error: message,
      })
      return response.badRequest({ message })
    }
  }

  async deploymentRedeploy(ctx: HttpContext) {
    const { params, response } = ctx
    await ctx.request.validateUsing(railwayActionValidator)
    const service = new RailwayApiService()
    try {
      const deploymentId = await service.deploymentRedeploy(params.id)

      await recordAdminAction(ctx, {
        action: 'server.deploy',
        targetType: 'RailwayDeployment',
        targetId: params.id,
        reason: ctx.request.input('reason') ?? null,
        metadata: { kind: 'redeploy', newDeploymentId: deploymentId },
      })

      return response.ok({ success: true, deploymentId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to redeploy'
      await recordAdminAction(ctx, {
        action: 'server.deploy',
        targetType: 'RailwayDeployment',
        targetId: params.id,
        outcome: 'failed',
        error: message,
        metadata: { kind: 'redeploy' },
      })
      return response.badRequest({ message })
    }
  }

  /**
   * Trigger deploy for a service (e.g. when latest deployment is needs_approval).
   * Requires serviceId in params and environmentId in query.
   */
  async serviceDeploy(ctx: HttpContext) {
    const { params, request, response } = ctx
    /** `validateUsing` reads the merged query and body, so a `?environmentId=` caller still works. */
    const { environmentId } = await request.validateUsing(railwayServiceDeployValidator)
    if (!environmentId) {
      return response.badRequest({ message: 'environmentId is required' })
    }
    const apiService = new RailwayApiService()
    try {
      await apiService.serviceInstanceRedeploy(params.serviceId, environmentId)

      await recordAdminAction(ctx, {
        action: 'server.deploy',
        targetType: 'RailwayService',
        targetId: params.serviceId,
        reason: request.input('reason') ?? null,
        metadata: { kind: 'service_deploy', environmentId },
      })

      return response.ok({ success: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to trigger deploy'
      await recordAdminAction(ctx, {
        action: 'server.deploy',
        targetType: 'RailwayService',
        targetId: params.serviceId,
        outcome: 'failed',
        error: message,
        metadata: { kind: 'service_deploy', environmentId },
      })
      return response.badRequest({ message })
    }
  }

  /** Drops every cached Railway read, so the next page load is authoritative. */
  async refresh(ctx: HttpContext) {
    await new RailwayApiService().invalidateAll()
    return ctx.response.ok({ success: true })
  }
}
