import { defineConfig, drivers, store } from '@adonisjs/cache'
import app from '@adonisjs/core/services/app'
import env from '#start/env'

const cacheConfig = defineConfig({
  default: 'default',

  stores: {
    memoryOnly: store().useL1Layer(drivers.memory()),

    default: store()
      .useL1Layer(drivers.memory())
      .useL2Layer(
        drivers.file({
          directory: app.tmpPath('cache'),
        }),
      ),
  },
})

export default cacheConfig

declare module '@adonisjs/cache/types' {
  interface CacheStores extends InferStores<typeof cacheConfig> {}
}
