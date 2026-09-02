import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

import AdminAction from '#models/admin_action'
import { ADMIN_ACTIONS } from '#services/admin_audit_service'
import { MAX_PER_PAGE } from '#utils/vine'
import { auditActionsValidator, auditsIndexValidator } from '#validators/query'

/**
 * Who may read other people's actions.
 *
 * A regular admin still only sees their own trail — the previous behaviour, and the
 * right default. God admins and super admins see everything, which is the whole point
 * of keeping the log: nobody could previously answer "who banned that customer?"
 */
function canReadAllAudits(user: { isGodAdmin: boolean; role: string }): boolean {
  return user.isGodAdmin || user.role === 'super_admin'
}

export default class AuditsController {
  /** The audit page itself. Data is fetched by the endpoints below. */
  async page({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    return inertia.render('audits/index', {
      canReadAll: canReadAllAudits(user),
      actions: [...ADMIN_ACTIONS],
    })
  }

  /**
   * Operator actions — the intent log.
   *
   * Distinct from `index()` below, which reports model field diffs from
   * adonis-auditing. This one knows which environment an action touched and why it was
   * taken, neither of which the model audits record.
   */
  async actions({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await request.validateUsing(auditActionsValidator)
    const params = await request.paginationQs()
    const page = params.page ?? 1
    const perPage = Math.min(params.perPage ?? 25, MAX_PER_PAGE)

    const { action, appEnv, actorId, outcome, targetType, targetId } = request.qs()

    const query = AdminAction.query()

    /** The scope decision, applied before any request filter can widen it. */
    if (!canReadAllAudits(user)) {
      query.where('actorId', user.id)
    } else if (typeof actorId === 'string' && actorId) {
      query.where('actorId', actorId)
    }

    if (typeof action === 'string' && action) query.where('action', action)
    if (appEnv === 'dev' || appEnv === 'prod') query.where('appEnv', appEnv)
    if (outcome === 'success' || outcome === 'failed') query.where('outcome', outcome)
    if (typeof targetType === 'string' && targetType) query.where('targetType', targetType)
    if (typeof targetId === 'string' && targetId) query.where('targetId', targetId)
    if (params.startDate && params.endDate) {
      query.whereBetween('createdAt', [
        `${params.startDate} 00:00:00`,
        `${params.endDate} 23:59:59`,
      ])
    }
    if (params.search) {
      const term = `%${params.search}%`
      query.where((sub) => {
        sub
          .whereILike('actorEmail', term)
          .orWhereILike('targetLabel', term)
          .orWhereILike('reason', term)
      })
    }

    const results = await query.orderBy('createdAt', 'desc').paginate(page, perPage)

    return response.ok({
      data: results.all(),
      meta: results.getMeta(),
      scope: canReadAllAudits(user) ? 'all' : 'self',
    })
  }

  /** Distinct actors, for the filter dropdown. Only meaningful for a full-scope reader. */
  async actors({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!canReadAllAudits(user)) return response.ok({ data: [] })

    const rows = await db
      .from('admin_actions')
      .select('actor_id', 'actor_email')
      .whereNotNull('actor_id')
      .groupBy('actor_id', 'actor_email')
      .orderBy('actor_email', 'asc')
      .limit(200)

    return response.ok({
      data: rows.map((row) => ({ id: row.actor_id, email: row.actor_email })),
    })
  }

  /** Model field diffs from adonis-auditing. */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await request.validateUsing(auditsIndexValidator)
    const page = Math.max(Number(request.qs().page) || 1, 1)
    /** Clamped so a caller cannot ask for an unbounded result set. */
    const perPage = Math.min(Math.max(Number(request.qs().perPage) || 20, 1), MAX_PER_PAGE)
    const event = request.qs().event
    const auditableType = request.qs().auditableType
    const requestedUserId = request.qs().userId

    let query = db.from('audits')

    if (!canReadAllAudits(user)) {
      query = query.where('user_id', user.id)
    } else if (typeof requestedUserId === 'string' && requestedUserId) {
      query = query.where('user_id', requestedUserId)
    }

    if (event) {
      query = query.where('event', event)
    }

    if (auditableType) {
      query = query.where('auditable_type', auditableType)
    }

    const total = await query.clone().count('* as total').first()
    const audits = await query
      .orderBy('created_at', 'desc')
      .limit(perPage)
      .offset((page - 1) * perPage)
      .select('*')

    return response.ok({
      data: audits,
      meta: {
        currentPage: page,
        perPage,
        total: Number(total?.total || 0),
        lastPage: Math.ceil(Number(total?.total || 0) / perPage),
      },
      scope: canReadAllAudits(user) ? 'all' : 'self',
    })
  }

  async recent({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const audits = await db
      .from('audits')
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')
      .limit(10)
      .select('*')

    return response.ok({ audits })
  }

  /** Scaffold: implemented by the feature branch that owns it. */
  async export({ response }: HttpContext) {
    return response.notImplemented({ error: 'Not implemented' })
  }
}
