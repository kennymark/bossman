import type { HttpContext } from '@adonisjs/core/http'

import TeamMember from '#models/team_member'
import TeamMemberTransformer from '#transformers/team_member_transformer'

/** Admin role and the `teams` page grant are enforced by the route group. */
export default class TeamsPageController {
  async index({ request, inertia }: HttpContext) {
    const params = await request.paginationQs()

    const members = await TeamMember.query()
      .if(params.search, (q) => {
        q.whereHas('user', (uq) => {
          uq.whereILike('email', `%${params.search}%`).orWhereILike(
            'fullName',
            `%${params.search}%`,
          )
        })
      })
      .preload('user')
      .orderBy('createdAt', 'desc')
      .sortBy(params.sortBy || 'createdAt', params.sortOrder || 'desc')
      .paginate(params.page || 1, params.perPage || 10)

    return inertia.render('teams/index', {
      members: inertia.defer(async () =>
        TeamMemberTransformer.paginate(members.all(), members.getMeta()),
      ),
    })
  }

  async show({ params, inertia }: HttpContext) {
    const member = await TeamMember.query().where('id', params.id).preload('user').firstOrFail()

    return inertia.render('teams/member-show', {
      member: TeamMemberTransformer.transform(member),
    })
  }
}
