import vine from '@vinejs/vine'

/** The only two environments a session can point at. */
export const updateAppEnvValidator = vine.create(
  vine.object({
    appEnv: vine.enum(['dev', 'prod'] as const),
  }),
)
