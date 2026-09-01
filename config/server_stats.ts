import { defineConfig } from 'adonisjs-server-stats'

export default defineConfig({
  /**
   * Who may read the stats endpoint and see the toolbar.
   *
   * This reads `ctx.auth.user`, so it depends on `silent_auth_middleware` having
   * resolved the session. That middleware used to skip this very path, which meant the
   * guard always saw an anonymous request and denied everyone — do not add a skip back.
   */
  authorize: (ctx) => Boolean(ctx.auth.user?.isGodAdmin),

  /**
   * How often the client polls for stats, in milliseconds. Higher means fewer HTTP
   * requests from the stats bar.
   */
  pollInterval: 10_000,

  dashboard: true,

  toolbar: {
    tracing: true,

    /**
     * Paths kept out of the trace list because they are polling noise and would drown
     * out real requests. These are matched with `startsWith`, so they have to be exact
     * — `' /stats/api/requests'` carried a leading space and silently matched nothing.
     */
    excludeFromTracing: ['/admin/api/debug', '/__transmit', '/stats/api/requests'],
  },

  /**
   * SSE broadcasting of the stats payload. Left off: the toolbar polls
   * `pollInterval` instead, which is enough for a console.
   *
   * Note this flag does not gate the dashboard and debug channels — those broadcast
   * whenever Transmit is available, which is why `start/transmit.ts` guards them.
   */
  realtime: false,

  collectors: 'auto',

  /**
   * Opt in to running in production.
   *
   * Outside production the package registers everything; in production it registers
   * *nothing* unless this is set — including the Edge plugin behind `@serverStats()`.
   * That is why the deployed app rendered the literal text `@serverStats()`: an
   * unregistered Edge tag is emitted verbatim.
   *
   * Enabling requires the `authorize` guard above, which limits both the endpoint and
   * the toolbar to god admins. `capture` is deliberately omitted: every capture
   * subsystem defaults to off in production, so metrics are collected but request
   * bodies and queries are not. Set `enabled: false` to turn the whole thing off in
   * production again.
   */
  production: {
    enabled: true,
  },
})
