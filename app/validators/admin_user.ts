import vine from '@vinejs/vine'

export const updateAdminUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().maxLength(255),
    role: vine.enum(['admin'] as const),
  }),
)
