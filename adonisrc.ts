import { indexEntities } from '@adonisjs/core'
import { defineConfig } from '@adonisjs/core/app'
import { indexPages } from '@adonisjs/inertia'
import { generateRegistry } from '@tuyau/core/hooks'

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Experimental flags
  |--------------------------------------------------------------------------
  |
  | The following features will be enabled by default in the next major release
  | of AdonisJS. You can opt into them today to avoid any breaking changes
  | during upgrade.
  |
  */
  experimental: {
    mergeMultipartFieldsAndFiles: true,
    shutdownInReverseOrder: true,
  },

  /*
  |--------------------------------------------------------------------------
  | Commands
  |--------------------------------------------------------------------------
  |
  | List of ace commands to register from packages. The application commands
  | will be scanned automatically from the "./commands" directory.
  |
  */
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/mail/commands'),
    () => import('@jrmc/adonis-attachment/commands'),
    () => import('@adonisjs/cache/commands'),
  ],

  /*
  |--------------------------------------------------------------------------
  | Service providers
  |--------------------------------------------------------------------------
  |
  | List of service providers to import and register when booting the
  | application
  |
  */
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    {
      file: () => import('adonisjs-server-stats/provider'),
      environment: ['web'],
    },
    {
      file: () => import('adonisjs-server-stats/log-stream/provider'),
      environment: ['web'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/core/providers/edge_provider'),
    () => import('@adonisjs/session/session_provider'),
    () => import('@adonisjs/vite/vite_provider'),
    () => import('@adonisjs/shield/shield_provider'),
    () => import('@adonisjs/static/static_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('@adonisjs/mail/mail_provider'),
    () => import('@adonisjs/inertia/inertia_provider'),
    () => import('@adonisjs/transmit/transmit_provider'),
    () => import('@adonisjs/drive/drive_provider'),
    () => import('@jrmc/adonis-attachment/attachment_provider'),
    () => import('@adonisjs/cache/cache_provider'),
    () => import('@adonisjs/limiter/limiter_provider'),
    () => import('@stouder-io/adonis-auditing/auditing_provider'),
    () => import('@adonisjs/otel/otel_provider'),
  ],

  /*
  |--------------------------------------------------------------------------
  | Preloads
  |--------------------------------------------------------------------------
  |
  | List of modules to import before starting the application.
  |
  */
  preloads: [
    /** Must come first: later preloads and controllers rely on these macros. */
    () => import('#start/extensions'),
    () => import('#start/routes'),
    () => import('#start/kernel'),
    () => import('#start/events'),
    /**
     * Only the web process runs the job queue. Preloaded everywhere, pg-boss started
     * workers and registered cron schedules inside every ace command and the test
     * runner, whose polling connections then kept those processes alive forever.
     */
    {
      file: () => import('#start/boss'),
      environment: ['web'],
    },
    () => import('#start/email'),
    () => import('#start/mail'),
  ],

  /*
  |--------------------------------------------------------------------------
  | Tests
  |--------------------------------------------------------------------------
  |
  | List of test suites to organize tests by their type. Feel free to remove
  | and add additional suites.
  |
  */
  tests: {
    suites: [
      {
        files: ['tests/unit/**/*.spec.{ts,js}'],
        name: 'unit',
        timeout: 2000,
      },
      {
        files: ['tests/functional/**/*.spec.{ts,js}'],
        name: 'functional',
        timeout: 30000,
      },
    ],
    forceExit: false,
  },

  metaFiles: [
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false,
    },
    {
      pattern: 'public/**',
      reloadServer: false,
    },
  ],

  hooks: {
    init: [
      indexEntities({ transformers: { enabled: true, withSharedProps: true } }),
      indexPages({ framework: 'react' }),
      generateRegistry(),
    ],
    buildStarting: [() => import('@adonisjs/vite/build_hook')],
  },
  directories: {
    audit_resolvers: 'app/audit_resolvers',
  },
})
