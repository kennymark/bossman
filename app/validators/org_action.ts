import vine from '@vinejs/vine'

/**
 * Bulk actions are capped: without a ceiling a single request could rewrite every org
 * in the production database, and the dry-run preview would be unreadable anyway.
 */
export const MAX_BULK_ORGS = 500

export const bulkOrgIdsValidator = vine.create(
  vine.object({
    orgIds: vine.array(vine.string()).minLength(1).maxLength(MAX_BULK_ORGS),
    /** Retyped by the operator; the controller checks it against the affected count. */
    confirm: vine.string().trim().maxLength(200).optional(),
    reason: vine.string().trim().maxLength(500).optional(),
  }),
)

/** Dry run: which orgs a bulk action would touch, without touching them. */
export const bulkPreviewValidator = vine.create(
  vine.object({
    orgIds: vine.array(vine.string()).minLength(1).maxLength(MAX_BULK_ORGS),
  }),
)

export const banUserValidator = vine.create(
  vine.object({
    reason: vine.string(),
    metadata: vine
      .object({
        accountBannedBy: vine.object({
          id: vine.string(),
          name: vine.string(),
          email: vine.string(),
        }),
      })
      .optional(),
    banStartsAt: vine
      .date({ formats: ['iso8601'] })
      .optional()
      .requiredWhen('isInstantSend', '=', false),
    isInstantSend: vine.boolean().optional(),
    isTemporarilyPaused: vine.boolean().optional(),
  }),
)
