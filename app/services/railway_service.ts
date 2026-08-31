import cache from '@adonisjs/cache/services/main'
import logger from '@adonisjs/core/services/logger'
import axios, { type AxiosInstance } from 'axios'

import env from '#start/env'

const RAILWAY_GRAPHQL = 'https://backboard.railway.app/graphql/v2'

/**
 * How long each kind of Railway data stays fresh.
 *
 * Every read used to call the Railway GraphQL API directly, so opening `/servers`,
 * sorting it, or reloading the page issued a fresh round trip — and the project detail
 * page did it server-side, before the response was even sent. These are shaped by how
 * fast the underlying thing actually changes.
 */
const TTL = {
  /** Projects are created and renamed rarely. */
  projects: '5m',
  /** A project's services and environments change about as rarely. */
  project: '5m',
  /**
   * Deployments move on their own, so this is short. It exists to absorb bursts — a
   * sheet being opened and closed repeatedly — not to hide state.
   */
  deployments: '20s',
} as const

/**
 * Serve stale data rather than an error when Railway is unreachable.
 *
 * A read-only console page showing a five-minute-old project list is far more useful
 * than one showing "Failed to fetch Railway projects" because the upstream API
 * hiccupped.
 */
const GRACE = '30m'

/** Cache tags, so a mutation can drop exactly what it invalidated. */
const TAGS = {
  all: 'railway',
  project: (projectId: string) => `railway:project:${projectId}`,
  service: (serviceId: string) => `railway:service:${serviceId}`,
}

export interface RailwayProject {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface RailwayService {
  id: string
  name: string
  icon: string | null
}

export interface RailwayEnvironment {
  id: string
  name: string
}

export interface RailwayDeployment {
  id: string
  status: string
  createdAt: string
  meta: string | null
  canRedeploy: boolean
  canRollback: boolean
}

export interface RailwayProjectDetail extends RailwayProject {
  services: RailwayService[]
  environments: RailwayEnvironment[]
}

export interface RailwayRuntimeLog {
  message: string
  timestamp: string
  level?: string
}

/** Per-call cache control for the read methods. */
export interface ReadOptions {
  /** Bypass the cache and refill it. Drives the Refresh button on the servers pages. */
  forceFresh?: boolean
}

/**
 * Drops cache entries by tag.
 *
 * Never throws: failing to clear a cache entry must not turn a successful redeploy into
 * an error response. The worst case is one stale read for the remaining TTL.
 */
async function invalidate(tags: string[]): Promise<void> {
  try {
    await cache.deleteByTag({ tags })
  } catch (err) {
    logger.warn({ err, tags }, 'Could not invalidate Railway cache')
  }
}

function createClient(): AxiosInstance {
  const token = env.get('RAILWAY_API_KEY')
  return axios.create({
    baseURL: RAILWAY_GRAPHQL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export class RailwayApiService {
  private client = createClient()

  private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const { data } = await this.client.post<{ data?: T; errors?: Array<{ message: string }> }>('', {
      query,
      variables,
    })
    if (data.errors?.length) {
      throw new Error(data.errors.map((e) => e.message).join('; '))
    }
    if (data.data == null) {
      throw new Error('No data returned from Railway API')
    }
    return data.data
  }

  async listProjects(options: ReadOptions = {}): Promise<RailwayProject[]> {
    return cache.getOrSet({
      key: 'railway:projects',
      ttl: TTL.projects,
      grace: GRACE,
      tags: [TAGS.all],
      forceFresh: options.forceFresh,
      factory: () => this.fetchProjects(),
    })
  }

  private async fetchProjects(): Promise<RailwayProject[]> {
    const data = await this.graphql<{
      projects: { edges: Array<{ node: RailwayProject }> }
    }>(`
      query {
        projects {
          edges {
            node {
              id
              name
              description
              createdAt
              updatedAt
            }
          }
        }
      }
    `)
    return data.projects.edges.map((e) => e.node)
  }

  async getProject(
    projectId: string,
    options: ReadOptions = {},
  ): Promise<RailwayProjectDetail | null> {
    return cache.getOrSet({
      key: `railway:project:${projectId}`,
      ttl: TTL.project,
      grace: GRACE,
      tags: [TAGS.all, TAGS.project(projectId)],
      forceFresh: options.forceFresh,
      factory: () => this.fetchProject(projectId),
    })
  }

  private async fetchProject(projectId: string): Promise<RailwayProjectDetail | null> {
    const data = await this.graphql<{
      project: {
        id: string
        name: string
        description: string | null
        createdAt: string
        updatedAt: string
        services: { edges: Array<{ node: RailwayService }> }
        environments: { edges: Array<{ node: RailwayEnvironment }> }
      } | null
    }>(
      `
      query project($id: String!) {
        project(id: $id) {
          id
          name
          description
          createdAt
          updatedAt
          services {
            edges {
              node {
                id
                name
                icon
              }
            }
          }
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `,
      { id: projectId },
    )
    const p = data.project
    if (!p) return null
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      services: p.services.edges.map((e) => e.node),
      environments: p.environments.edges.map((e) => e.node),
    }
  }

  async getDeployments(
    projectId: string,
    serviceId: string,
    environmentId: string,
    limit: number = 5,
    options: ReadOptions = {},
  ): Promise<RailwayDeployment[]> {
    return cache.getOrSet({
      key: `railway:deployments:${projectId}:${serviceId}:${environmentId}:${limit}`,
      ttl: TTL.deployments,
      grace: GRACE,
      tags: [TAGS.all, TAGS.project(projectId), TAGS.service(serviceId)],
      forceFresh: options.forceFresh,
      factory: () => this.fetchDeployments(projectId, serviceId, environmentId, limit),
    })
  }

  private async fetchDeployments(
    projectId: string,
    serviceId: string,
    environmentId: string,
    limit: number,
  ): Promise<RailwayDeployment[]> {
    const data = await this.graphql<{
      deployments: { edges: Array<{ node: RailwayDeployment }> }
    }>(
      `
      query deployments($first: Int!, $input: DeploymentListInput!) {
        deployments(first: $first, input: $input) {
          edges {
            node {
              id
              status
              createdAt
              meta
              canRedeploy
              canRollback
            }
          }
        }
      }
    `,
      {
        first: limit,
        input: { projectId, environmentId, serviceId },
      },
    )
    return (data.deployments?.edges ?? []).map((e) => e.node)
  }

  async getDeploymentRuntimeLogs(
    deploymentId: string,
    limit: number = 500,
  ): Promise<RailwayRuntimeLog[]> {
    const data = await this.graphql<{
      deploymentLogs: Array<{ message: string; severity?: string; timestamp: string }>
    }>(
      `
      query deploymentLogs($deploymentId: String!, $limit: Int) {
        deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
          message
          severity
          timestamp
        }
      }
    `,
      { deploymentId, limit },
    )
    const logs = data.deploymentLogs ?? []
    return logs.map((log) => ({
      message: log.message,
      timestamp: log.timestamp,
      level: log.severity ?? undefined,
    }))
  }

  /**
   * Get build logs for a deployment (see https://docs.railway.com/integrations/api/manage-deployments#get-build-logs).
   */
  async getDeploymentBuildLogs(
    deploymentId: string,
    limit: number = 500,
  ): Promise<RailwayRuntimeLog[]> {
    const data = await this.graphql<{
      buildLogs: Array<{ message: string; severity?: string; timestamp: string }>
    }>(
      `
      query buildLogs($deploymentId: String!, $limit: Int) {
        buildLogs(deploymentId: $deploymentId, limit: $limit) {
          message
          severity
          timestamp
        }
      }
    `,
      { deploymentId, limit },
    )
    const logs = data.buildLogs ?? []
    return logs.map((log) => ({
      message: log.message,
      timestamp: log.timestamp,
      level: log.severity ?? undefined,
    }))
  }

  async deploymentRestart(deploymentId: string): Promise<boolean> {
    const data = await this.graphql<{ deploymentRestart: boolean }>(
      `
      mutation deploymentRestart($id: String!) {
        deploymentRestart(id: $id)
      }
    `,
      { id: deploymentId },
    )
    /**
     * The deployment list this came from is now wrong. Dropping it here means the very
     * next read shows the new state rather than a cached "before" for up to the TTL —
     * which on an action page would look like the button did nothing.
     */
    await invalidate([TAGS.all])
    return data.deploymentRestart === true
  }

  async deploymentRedeploy(deploymentId: string): Promise<string | null> {
    const data = await this.graphql<{ deploymentRedeploy: string | null }>(
      `
      mutation deploymentRedeploy($id: String!) {
        deploymentRedeploy(id: $id)
      }
    `,
      { id: deploymentId },
    )
    await invalidate([TAGS.all])
    return data.deploymentRedeploy
  }

  /**
   * Trigger a deploy for a service (e.g. when latest deployment is needs_approval).
   * Uses serviceInstanceRedeploy so Railway starts a deployment for the service.
   */
  async serviceInstanceRedeploy(serviceId: string, environmentId: string): Promise<boolean> {
    const data = await this.graphql<{ serviceInstanceRedeploy: boolean }>(
      `
      mutation serviceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `,
      { serviceId, environmentId },
    )
    await invalidate([TAGS.service(serviceId)])
    return data.serviceInstanceRedeploy === true
  }

  /** Drops every cached Railway read. Backs the Refresh control. */
  async invalidateAll(): Promise<void> {
    await invalidate([TAGS.all])
  }
}
