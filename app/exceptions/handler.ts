import { ExceptionHandler, type HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, ctx) => {
      if (ctx.inertia) {
        return ctx.inertia.render('errors/not_found', { error })
      }
      return ctx.response.status(404).send({ error: 'Not found' })
    },
    '500..599': (error, ctx) => {
      if (ctx.inertia) {
        return ctx.inertia.render('errors/server_error', { error })
      }
      return ctx.response.status(500).send({ error: 'Internal server error' })
    },
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: any, ctx: HttpContext) {
    const { response, session } = ctx

    // Handle Inertia requests differently
    if (ctx.inertia) {
      // Handle database errors
      if (error.code === '23502') {
        /** Inertia also serves public pages, so the column name is logged, not flashed. */
        ctx.logger.error({ err: error }, 'not-null violation')
        session.flash('error', { message: 'A required field was missing.' })
        return response.redirect().back()
      }

      if (error.code === '23505') {
        session.flash('error', {
          message: convertToReadableFormat(error.detail),
        })
        return response.redirect().back()
      }
    }

    // Handle API requests (non-Inertia)
    if (error.code === 'E_VALIDATION_EXCEPTION' || error.code === 'E_VALIDATION_ERROR') {
      return response.badRequest({
        error: 'Validation failed',
        type: 'validation',
        messages: error.messages,
      })
    }

    if (error.code === 'E_AUTHORIZATION_FAILURE') {
      return response.status(403).send({
        error: 'You are not authorized to perform this action',
        type: 'auth',
      })
    }

    if (error.code === 'E_INVALID_CREDENTIALS') {
      return response.unauthorized({ error: 'Your email or password is incorrect' })
    }

    if (error.code === '23502') {
      /** The column name is logged, not returned: it discloses the schema. */
      ctx.logger.error({ err: error }, 'not-null violation')
      return response.internalServerError({ error: 'A required field was missing.' })
    }

    if (error.code === '23505') {
      return response.badRequest({ error: convertToReadableFormat(error.detail) })
    }

    if (error.code === 'E_BAD_CSRF_TOKEN') {
      return response.badRequest({ error: 'CSRF token mismatch' })
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}

// Key (email)=(agency@yourgaff.co.uk) already exists.
// convert this string to a more readable format
/**
 * Turns a Postgres uniqueness detail into a message safe to show a user.
 *
 * Falls back to a generic string rather than the raw driver detail, which would leak
 * constraint and column names for any format this does not recognise.
 */
function convertToReadableFormat(error: string) {
  const regex = /Key \((.*?)\)=\((.*?)\) already exists./
  const match = error.match(regex)
  if (match) {
    return `The ${match[1]} ${match[2]} already exists.`
  }
  return 'That value is already taken.'
}
