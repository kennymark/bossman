import type { HttpContext } from '@adonisjs/core/http'

import { RailwayApiService } from '#services/railway_service'

/** Admin role and the `servers` page grant are enforced by the route group. */
export default class RailwayController {
  async projects(ctx: HttpContext) {
    const service = new RailwayApiService()
    try {
      const projects = await service.listProjects()
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
      const project = await service.getProject(params.id)
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
    const environmentId = request.qs().environmentId as string | undefined
    const projectId = (request.qs().projectId as string | undefined) ?? ''
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
      )
      return response.ok(deployments)
    } catch (err) {
      return response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to fetch deployments',
      })
    }
  }

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
    const service = new RailwayApiService()
    try {
      await service.deploymentRestart(params.id)
      return response.ok({ success: true })
    } catch (err) {
      return response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to restart deployment',
      })
    }
  }

  async deploymentRedeploy(ctx: HttpContext) {
    const { params, response } = ctx
    const service = new RailwayApiService()
    try {
      const deploymentId = await service.deploymentRedeploy(params.id)
      return response.ok({ success: true, deploymentId })
    } catch (err) {
      return response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to redeploy',
      })
    }
  }

  /**
   * Trigger deploy for a service (e.g. when latest deployment is needs_approval).
   * Requires serviceId in params and environmentId in query.
   */
  async serviceDeploy(ctx: HttpContext) {
    const { params, request, response } = ctx
    const environmentId = request.qs().environmentId as string | undefined
    if (!environmentId) {
      return response.badRequest({ message: 'environmentId is required' })
    }
    const apiService = new RailwayApiService()
    try {
      await apiService.serviceInstanceRedeploy(params.serviceId, environmentId)
      return response.ok({ success: true })
    } catch (err) {
      return response.badRequest({
        message: err instanceof Error ? err.message : 'Failed to trigger deploy',
      })
    }
  }
}
