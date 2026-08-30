import type { HttpContext } from '@adonisjs/core/http'

import { RailwayApiService } from '#services/railway_service'
import { renderInertia } from '#utils/inertia'

const SERVERS_SORT_VALUES = [
  'updatedAt:desc',
  'updatedAt:asc',
  'name:asc',
  'name:desc',
  'createdAt:desc',
  'createdAt:asc',
] as const

export type ServersSortValue = (typeof SERVERS_SORT_VALUES)[number]

/** Admin role and the `servers` page grant are enforced by the route group. */
export default class ServersController {
  async index({ inertia, request, session }: HttpContext) {
    const sortInput = request.input('sort') as string | undefined
    const savedSort = session.get('servers_sort') as ServersSortValue | undefined
    const sort: ServersSortValue = SERVERS_SORT_VALUES.includes(sortInput as ServersSortValue)
      ? (sortInput as ServersSortValue)
      : (savedSort ?? 'updatedAt:desc')

    session.put('servers_sort', sort)

    return renderInertia(inertia, 'servers/index', { sort })
  }

  async show({ params, inertia }: HttpContext) {
    const railway = new RailwayApiService()
    const project = await railway.getProject(params.projectId)
    return renderInertia(inertia, 'servers/project-show', {
      projectName: project?.name ?? null,
      project,
    })
  }
}
