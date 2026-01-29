import vine from '@vinejs/vine'

const email = vine.string().toLowerCase().trim().email()

export const createUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().maxLength(255),
    email,
    password: vine.string(),
  }),
)

export const loginValidator = vine.compile(
  vine.object({
    email,
    password: vine.string(),
    remember: vine.boolean().optional(),
    referrer: vine.string().optional(),
  }),
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email,
  }),
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    newPassword: vine.string(),
    token: vine.string(),
  }),
)
