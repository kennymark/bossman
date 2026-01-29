import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine.string().maxLength(255).optional(),
    email: vine.string().toLowerCase().trim().email().optional(),
  }),
)

export const updatePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8),
    confirmPassword: vine.string().confirmed({ confirmationField: 'newPassword' }),
  }),
)
