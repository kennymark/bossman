import { defineConfig } from '@adonisjs/lucid'

import env from '#start/env'

/**
 * Query logging is verbose and echoes bound values (including production row data)
 * into the logs, so it is limited to development.
 */
const debug = env.get('NODE_ENV') === 'development'

const dbConfig = defineConfig({
  connection: 'default',

  connections: {
    dev: {
      client: 'pg',
      connection: env.get('DEV_DB'),
      debug,
    },
    prod: {
      client: 'pg',
      connection: env.get('PROD_DB'),
      debug,
    },

    default: {
      client: 'pg',
      connection: env.get('ADMIN_DB'),
      useNullAsDefault: true,
      debug,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
