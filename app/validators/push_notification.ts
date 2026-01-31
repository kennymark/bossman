import vine from '@vinejs/vine'

export const storePushNotificationValidator = vine.compile(
  vine.object({
    targetType: vine.enum(['all', 'all_landlords', 'all_tenants', 'all_agencies', 'specific']),
    targetUserIds: vine.array(vine.string()).optional(),
    title: vine.string().trim().minLength(1).maxLength(255),
    description: vine.string().trim().minLength(1),
    imageUrl: vine.string().trim().url().maxLength(2048).optional(),
    url: vine.string().trim().maxLength(2048).optional(),
    sendAt: vine
      .string()
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  }),
)
