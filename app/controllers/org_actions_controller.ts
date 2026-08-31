import { createHash } from 'node:crypto'

import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import { banUser } from '#boss/jobs/ban_user'
import AccountBan from '#models/account_ban'
import DeleteAccountRequest from '#models/delete_account_request'
import Org from '#models/org'
import { recordAdminAction } from '#services/admin_audit_service'
import { generateShortId } from '#services/app.functions'
import mailer from '#services/email_service'
import env from '#start/env'
import { CONFIRMATION_PHRASES, confirmationMatches, reasonIsValid } from '#utils/confirmation'
import { banUserValidator, bulkOrgIdsValidator, bulkPreviewValidator } from '#validators/org_action'

function hashDeleteRequestToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

const appUrl = env.get('APP_URL')

export default class OrgActionsController {
  async getBanStatus({ request, params, response }: HttpContext) {
    const { orgId } = params
    const connection = request.appEnv()
    const org = await Org.query({ connection }).where('id', orgId).firstOrFail()

    const ban = await AccountBan.query({ connection })
      .where('orgId', org.id)
      .orderBy('createdAt', 'desc')
      .first()

    return response.ok({ isBanned: ban?.isBanActive ?? false })
  }

  async banUser(ctx: HttpContext) {
    const { request, params, auth, response, now } = ctx
    const { orgId } = params
    const body = await request.validateUsing(banUserValidator)
    const connection = request.appEnv()
    const org = await Org.query({ connection }).where('id', orgId).preload('owner').firstOrFail()

    /**
     * Banning cuts a paying customer off from the product, so the operator retypes the
     * org name. Checked here, not only in the dialog.
     */
    const label = org.cleanName ?? org.name ?? org.id
    const expected = CONFIRMATION_PHRASES['org.ban'](label)
    if (!confirmationMatches(request.input('confirm'), expected)) {
      return response.badRequest({
        error: `Type "${expected}" to confirm this ban.`,
        type: 'confirmation',
      })
    }

    if (!reasonIsValid(body.reason)) {
      return response.badRequest({ error: 'A reason of at least 8 characters is required.' })
    }

    const { id, fullName, email } = auth.getUserOrFail()
    const bannedBy = { id, name: fullName ?? '', email }
    const metadata = { ...body.metadata, accountBannedBy: bannedBy }

    const when = body.banStartsAt ?? now.toJSDate()

    const jobData = {
      orgId: org.id,
      userId: org.owner.id,
      reason: body.reason,
      metadata,
      connection,
      banStartsAt: body.banStartsAt?.toISOString() ?? now.toJSDate().toISOString(),
    }

    await banUser.schedule(jobData, when)

    await recordAdminAction(ctx, {
      action: 'org.ban',
      appEnv: connection,
      targetType: 'Org',
      targetId: org.id,
      targetLabel: label,
      reason: body.reason,
      metadata: { banStartsAt: jobData.banStartsAt, ownerId: org.owner.id },
    })

    return response.ok({ message: 'User banned successfully' })
  }

  // unban user
  async unbanUser(ctx: HttpContext) {
    const { request, params, now, response, auth } = ctx
    const { orgId } = params
    const connection = request.appEnv()
    const org = await Org.query({ connection }).where('id', orgId).firstOrFail()

    //find the most recent ban for the user
    const ban = await AccountBan.query({ connection })
      .where('orgId', org.id)
      .orderBy('createdAt', 'desc')
      .firstOrFail()

    // update the ban to set the expiresAt to null
    ban?.merge({ expiresAt: null, removedAt: now, isBanActive: false })
    await ban.save()

    await mailer.send({
      type: 'access-restored',
      data: { email: org.email, fullName: org.cleanName },
    })

    /** The ban recorded who applied it; nothing recorded who lifted it. */
    const actor = auth.getUserOrFail()
    await recordAdminAction(ctx, {
      action: 'org.unban',
      appEnv: connection,
      targetType: 'Org',
      targetId: org.id,
      targetLabel: org.cleanName ?? org.name ?? org.id,
      reason: request.input('reason') ?? null,
      metadata: { banId: ban.id, unbannedBy: actor.email },
    })

    return response.ok({ message: 'User unbanned successfully' })
  }

  async makeFavourite(ctx: HttpContext) {
    const org = await this.setOrgFlag(ctx, 'isFavourite', true, 'org.favourite')
    return ctx.response.ok({ message: 'Marked as favourite', isFavourite: org.isFavourite })
  }

  async undoFavourite(ctx: HttpContext) {
    const org = await this.setOrgFlag(ctx, 'isFavourite', false, 'org.favourite')
    return ctx.response.ok({ message: 'Removed from favourites', isFavourite: org.isFavourite })
  }

  async makeTestAccount(ctx: HttpContext) {
    const org = await this.setOrgFlag(ctx, 'isTestAccount', true, 'org.test_account')
    return ctx.response.ok({ message: 'Marked as test account', isTestAccount: org.isTestAccount })
  }

  async undoTestAccount(ctx: HttpContext) {
    const org = await this.setOrgFlag(ctx, 'isTestAccount', false, 'org.test_account')
    return ctx.response.ok({
      message: 'Removed test account flag',
      isTestAccount: org.isTestAccount,
    })
  }

  /**
   * Sets one boolean flag on an org and records it.
   *
   * `Org` is not `Auditable` — and cannot easily be, since the mixin copies every
   * attribute into the audit row — so without this, changing a customer's flags in
   * production left no trace of who did it.
   */
  private async setOrgFlag(
    ctx: HttpContext,
    field: 'isFavourite' | 'isTestAccount' | 'isSalesOrg',
    value: boolean,
    action: 'org.favourite' | 'org.test_account' | 'org.sales_account',
  ) {
    const { request, params } = ctx
    const connection = request.appEnv()
    const org = await Org.query({ connection }).where('id', params.orgId).firstOrFail()
    const previous = org[field]

    org[field] = value
    await org.save()

    await recordAdminAction(ctx, {
      action,
      appEnv: connection,
      targetType: 'Org',
      targetId: org.id,
      targetLabel: org.cleanName ?? org.name ?? org.id,
      reason: request.input('reason') ?? null,
      metadata: { field, from: previous, to: value },
    })

    return org
  }

  async toggleSalesAccount(ctx: HttpContext) {
    const { request, params, response } = ctx
    const connection = request.appEnv()
    const current = await Org.query({ connection }).where('id', params.orgId).firstOrFail()
    const org = await this.setOrgFlag(ctx, 'isSalesOrg', !current.isSalesOrg, 'org.sales_account')
    return response.ok({
      message: org.isSalesOrg ? 'Marked as sales account' : 'Removed sales account flag',
      isSalesOrg: org.isSalesOrg,
    })
  }

  /**
   * Dry run for a bulk action.
   *
   * Returns the orgs a bulk update would actually match, so the operator sees the real
   * blast radius — including ids that no longer exist — before anything is written.
   */
  async bulkPreview({ request, response }: HttpContext) {
    const connection = request.appEnv()
    const { orgIds } = await request.validateUsing(bulkPreviewValidator)

    const orgs = await Org.query({ connection })
      .whereIn('id', orgIds)
      .select('id', 'name', 'isFavourite', 'isTestAccount', 'isSalesOrg')

    const found = new Set(orgs.map((org) => org.id))

    return response.ok({
      requested: orgIds.length,
      matched: orgs.length,
      missing: orgIds.filter((id) => !found.has(id)),
      orgs: orgs.map((org) => ({
        id: org.id,
        name: org.cleanName ?? org.name,
        isFavourite: org.isFavourite,
        isTestAccount: org.isTestAccount,
        isSalesOrg: org.isSalesOrg,
      })),
      confirmationPhrase: CONFIRMATION_PHRASES['org.bulk'](orgs.length),
    })
  }

  async bulkMakeFavourite(ctx: HttpContext) {
    return this.applyBulkFlag(ctx, 'isFavourite', true, 'org.bulk_favourite', 'marked as favourite')
  }

  async bulkUndoFavourite(ctx: HttpContext) {
    return this.applyBulkFlag(
      ctx,
      'isFavourite',
      false,
      'org.bulk_favourite',
      'removed from favourites',
    )
  }

  async bulkMakeTestAccount(ctx: HttpContext) {
    return this.applyBulkFlag(
      ctx,
      'isTestAccount',
      true,
      'org.bulk_test_account',
      'marked as test account',
    )
  }

  async bulkUndoTestAccount(ctx: HttpContext) {
    return this.applyBulkFlag(
      ctx,
      'isTestAccount',
      false,
      'org.bulk_test_account',
      'removed test account flag',
    )
  }

  /**
   * Applies one flag across many orgs, behind a confirmation and into the audit log.
   *
   * The confirmation phrase names the number of orgs that will actually be updated, so
   * a stale selection — the list changed since the dialog opened — fails the check
   * rather than silently applying to a different set.
   */
  private async applyBulkFlag(
    ctx: HttpContext,
    field: 'isFavourite' | 'isTestAccount',
    value: boolean,
    action: 'org.bulk_favourite' | 'org.bulk_test_account',
    verb: string,
  ) {
    const { request, response } = ctx
    const connection = request.appEnv()
    const { orgIds, confirm, reason } = await request.validateUsing(bulkOrgIdsValidator)

    const matched = await Org.query({ connection }).whereIn('id', orgIds).select('id')
    const expected = CONFIRMATION_PHRASES['org.bulk'](matched.length)

    if (!confirmationMatches(confirm, expected)) {
      return response.badRequest({
        error: `Type "${expected}" to confirm. ${matched.length} of ${orgIds.length} selected org(s) still exist.`,
        type: 'confirmation',
        matched: matched.length,
        requested: orgIds.length,
      })
    }

    const count = await Org.query({ connection })
      .whereIn(
        'id',
        matched.map((org) => org.id),
      )
      .update({ [field]: value })

    await recordAdminAction(ctx, {
      action,
      appEnv: connection,
      targetType: 'Org',
      targetLabel: `${count} org(s)`,
      reason: reason ?? null,
      metadata: { field, to: value, requested: orgIds.length, updated: count, orgIds },
    })

    return response.ok({ message: `${count} org(s) ${verb}`, updated: count })
  }

  async requestDeleteCustomUser(ctx: HttpContext) {
    const { params, request, response } = ctx
    const { orgId } = params
    const connection = request.appEnv()
    const org = await Org.query({ connection }).where('id', orgId).preload('owner').firstOrFail()

    /** Sends a customer an irreversible-deletion link, so it is typed-confirmed too. */
    const label = org.cleanName ?? org.name ?? org.id
    const expected = CONFIRMATION_PHRASES['org.request_delete_user'](label)
    if (!confirmationMatches(request.input('confirm'), expected)) {
      return response.badRequest({
        error: `Type "${expected}" to confirm.`,
        type: 'confirmation',
      })
    }

    const reason = request.input('reason') ?? null
    if (!reasonIsValid(reason)) {
      return response.badRequest({ error: 'A reason of at least 8 characters is required.' })
    }

    const token = generateShortId(48)
    const tokenHash = hashDeleteRequestToken(token)
    const expiresAt = DateTime.now().plus({ days: 7 })

    await DeleteAccountRequest.create(
      {
        orgId: org.id,
        tokenHash,
        expiresAt,
      },
      { connection },
    )

    const baseUrl = `${appUrl}/confirm-delete-custom-user?token=${encodeURIComponent(token)}&connection=${encodeURIComponent(connection)}`
    const acceptUrl = `${baseUrl}&action=accept`
    const declineUrl = `${baseUrl}&action=decline`

    const email = org.creatorEmail
    const fullName = org.cleanName ?? 'User'

    await mailer.send({
      type: 'custom-user-delete-request',
      data: { email, fullName, acceptUrl, declineUrl },
    })

    await recordAdminAction(ctx, {
      action: 'org.request_delete_user',
      appEnv: connection,
      targetType: 'Org',
      targetId: org.id,
      targetLabel: label,
      reason,
      metadata: { sentTo: email, expiresAt: expiresAt.toISO() },
    })

    return response.ok({
      message:
        'Delete request email sent. The user can accept or decline from the link in the email.',
    })
  }
}
