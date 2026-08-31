import vine from '@vinejs/vine'

const email = vine.string().toLowerCase().trim().email()

export const createUserValidator = vine.create(
  vine.object({
    fullName: vine.string().maxLength(255),
    email,
    password: vine.string(),
  }),
)

export const loginValidator = vine.create(
  vine.object({
    email,
    password: vine.string(),
    remember: vine.boolean().optional(),
    referrer: vine.string().optional(),
  }),
)

export const forgotPasswordValidator = vine.create(
  vine.object({
    email,
  }),
)

export const resetPasswordValidator = vine.create(
  vine.object({
    newPassword: vine.string(),
    token: vine.string(),
  }),
)

/**
 * Second step of login. Exactly one of `token` (TOTP) or `recoveryCode` is used; the
 * controller rejects a request carrying neither.
 */
export const twoFactorChallengeValidator = vine.create(
  vine.object({
    token: vine.string().trim().maxLength(12).optional(),
    recoveryCode: vine.string().trim().maxLength(64).optional(),
  }),
)
