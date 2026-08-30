import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'

/**
 * Server-only conditional runners.
 *
 * These live apart from `#utils/functions` because that module is imported by Inertia
 * pages. Anything reachable from the client bundle must not import an AdonisJS service:
 * `@adonisjs/core/services/logger` resolves the application container at import time and
 * throws "Cannot read properties of undefined (reading 'booted')" in the browser, which
 * blanks the page before React can render.
 */
export async function runInProdOnly(fn: () => Promise<void> | void, rationale = '') {
  if (app.inProduction) {
    await fn()
  } else {
    logger.debug(`Skipping ${rationale} because NODE_ENV is not production`)
  }
}

export async function runInDevOnly(fn: () => Promise<void> | void, rationale = '') {
  if (app.inDev) {
    await fn()
  } else {
    logger.debug(`Skipping ${rationale} because NODE_ENV is not development`)
  }
}

export async function runIfTrue(
  condition: boolean,
  fn: () => Promise<void> | void,
  rationale = '',
) {
  if (condition) {
    await fn()
  } else {
    logger.debug(`Skipping ${rationale} because condition is false`)
  }
}

export async function runIfFalse(
  condition: boolean,
  fn: () => Promise<void> | void,
  rationale = '',
) {
  if (!condition) {
    await fn()
  } else {
    logger.debug(`Skipping ${rationale} because condition is true`)
  }
}
