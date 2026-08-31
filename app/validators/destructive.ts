import vine from '@vinejs/vine'

import { RESTORE_TARGETS } from '#types/env'
import { MAX_REASON_LENGTH, MIN_REASON_LENGTH } from '#utils/confirmation'

/**
 * Fields every destructive action carries.
 *
 * `reason` lands in the admin action log, so it is required and has to say something.
 * `confirm` is the phrase the operator retyped; the controller checks it against the
 * expected phrase for the specific target, which is what stops a mis-click from
 * restoring the wrong database.
 */
export const reasonRule = vine
  .string()
  .trim()
  .minLength(MIN_REASON_LENGTH)
  .maxLength(MAX_REASON_LENGTH)

export const confirmRule = vine.string().trim().maxLength(200)

export const restoreBackupValidator = vine.create(
  vine.object({
    /** Named database, never a connection URL. */
    target: vine.enum(RESTORE_TARGETS),
    reason: reasonRule,
    confirm: confirmRule,
  }),
)

export const restorePreviewValidator = vine.create(
  vine.object({
    target: vine.enum(RESTORE_TARGETS),
  }),
)

export const deleteBackupValidator = vine.create(
  vine.object({
    reason: reasonRule,
    confirm: confirmRule,
  }),
)

export const createBackupValidator = vine.create(
  vine.object({
    reason: vine.string().trim().maxLength(MAX_REASON_LENGTH).optional(),
  }),
)
