import vine from '@vinejs/vine'

import { MAX_REASON_LENGTH } from '#utils/confirmation'

/**
 * Body of `POST /api/v1/orgs/:orgId/actions/impersonate`.
 *
 * `reason` is only bounded here; the controller applies `reasonIsValid` so the message
 * for a too-short reason matches every other destructive action. `confirmation` is the
 * phrase the operator retyped, checked against the target user's email server-side.
 */
export const impersonateValidator = vine.create(
  vine.object({
    userId: vine.string().trim().minLength(1).maxLength(64),
    reason: vine.string().trim().maxLength(MAX_REASON_LENGTH),
    confirmation: vine.string().trim().maxLength(200),
  }),
)
