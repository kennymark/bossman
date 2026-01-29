import { defineConfig, services } from '@adonisjs/ally'
import env from '#start/env'

const allyConfig = defineConfig({
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID') as string,
    clientSecret: env.get('GOOGLE_CLIENT_SECRET') as string,
    callbackUrl: env.get('GOOGLE_CALLBACK_URL') as string,
  }),
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
