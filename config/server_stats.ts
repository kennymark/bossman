import { defineConfig } from 'adonisjs-server-stats'

export default defineConfig({
  // How often to collect and broadcast stats (in milliseconds).
  // Higher = fewer HTTP requests and fewer session commits from the stats bar.
  authorize: (ctx) => {
    const user = ctx.auth.user
    return Boolean(user?.isGodAdmin)
  },
  pollInterval: 10_000,
  dashboard: true,

  toolbar: {
    tracing: true,

    excludeFromTracing: ['/admin/api/debug', '/__transmit/events', ' /stats/api/requests'],
  },
  // Real-time transport: 'transmit' for SSE via @adonisjs/transmit, 'none' for polling only
  realtime: false,

  collectors: 'auto',
})
