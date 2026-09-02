/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  /** Shared secret that lets a monitoring system read the full /health report. */
  HEALTH_CHECK_SECRET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),
  LOOPS_API_KEY: Env.schema.string(),
  RAILWAY_API_KEY: Env.schema.string(),
  /** Set to false only if production is served over HTTP (e.g. behind proxy without HTTPS). Prefer using HTTPS. */
  SESSION_SECURE: Env.schema.boolean.optional(),
  FROM_EMAIL: Env.schema.string.optional(),
  REPLY_TO_EMAIL: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USERNAME: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['fs', 'backup', 'blog'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),

  /**
   * Pulse (Agenda) job store of the Togetha app, per environment. Optional: without a
   * URL the jobs page reports the environment as unconfigured instead of failing.
   */
  MONGO_URL_DEV: Env.schema.string.optional(),
  MONGO_URL_PROD: Env.schema.string.optional(),

  /**
   * Shared with the Togetha app (ADMIN_IMPERSONATION_SECRET there). Signs the one-shot
   * handoff token an operator uses to sign in as a customer. Optional: unset disables
   * impersonation rather than the whole app.
   */
  IMPERSONATION_SECRET: Env.schema.string.optional(),
  /** Where each environment of the Togetha app is served; used to build handoff links. */
  TOGETHA_DEV_URL: Env.schema.string.optional(),
  TOGETHA_PROD_URL: Env.schema.string.optional(),

  /**
   * Database connections. These were read by config/database.ts and the OTel/mail config
   * without being declared here, so a missing value surfaced as a runtime failure on the
   * first query instead of a clear error at boot.
   */
  ADMIN_DB: Env.schema.string(),
  DEV_DB: Env.schema.string(),
  PROD_DB: Env.schema.string(),

  /** Base URL used to build links in invitation and account emails. */
  APP_URL: Env.schema.string(),
  NO_REPLY_EMAIL: Env.schema.string.optional(),

  /** Axiom telemetry export; optional so the app runs without an observability backend. */
  AXIOM_TOKEN: Env.schema.string.optional(),
  AXIOM_DATASET: Env.schema.string.optional(),

  /** Only used by the one-off Strapi migration commands. */
  STRAPI_API: Env.schema.string.optional(),
  /*
  |----------------------------------------------------------
  | Variables for configuring OneSignal
  |----------------------------------------------------------
  */
  ONESIGNAL_APP_ID: Env.schema.string(),
  ONESIGNAL_API_ENDPOINT: Env.schema.string(),
  ONESIGNAL_API_KEY: Env.schema.string(),

  STRIPE_SECRET: Env.schema.string(),
  STRIPE_TEST_KEY: Env.schema.string(),
  R2_KEY: Env.schema.string(),
  R2_SECRET: Env.schema.string(),
  R2_BUCKET: Env.schema.string(),
  R2_ENDPOINT: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Twist
  |----------------------------------------------------------
  */
  TWIST_TOKEN: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  RESEND_API_KEY: Env.schema.string(),

  APP_NAME: Env.schema.string(),
  APP_VERSION: Env.schema.string(),
  APP_ENV: Env.schema.enum(['development', 'staging', 'production'] as const),
})
