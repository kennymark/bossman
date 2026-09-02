import vine from '@vinejs/vine'

export const updateProfileValidator = vine.create(
  vine.object({
    fullName: vine.string().maxLength(255).optional(),
    email: vine.string().toLowerCase().trim().email().optional(),
  }),
)

export const updatePasswordValidator = vine.create(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8),
    confirmPassword: vine.string().confirmed({ confirmationField: 'newPassword' }),
  }),
)

/**
 * The shapes below describe request bodies the controllers already read by hand with
 * `request.only([...])`, so that Tuyau can type them for the client. They stay
 * permissive on purpose: each field is optional here and the controller keeps its own
 * "is required" check, which is what produces the 400 the UI already knows how to
 * render. See `#validators/query` for the same reasoning on the query side.
 */

/** Revokes one device session. The controller rejects a missing id with a 400. */
export const revokeSessionValidator = vine.create(
  vine.object({ sessionId: vine.string().optional() }),
)

/** Re-authentication before a destructive account change. */
export const passwordConfirmationValidator = vine.create(
  vine.object({ password: vine.string().optional() }),
)

/**
 * Merged into the user's existing settings, so the accepted keys are open-ended by
 * design and the controller only insists that it received an object.
 */
export const updateSettingsValidator = vine.create(
  vine.object({ settings: vine.record(vine.any()).optional() }),
)

/**
 * The avatar arrives as multipart. `vine.any()` rather than `vine.file()` on purpose:
 * the controller does its own size and extension checks and answers with a 400 the UI
 * already handles, and a file rule here would pre-empt that with a 422 instead.
 */
export const uploadAvatarValidator = vine.create(vine.object({ avatar: vine.any().optional() }))
