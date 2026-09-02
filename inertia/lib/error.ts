import { TuyauHTTPError, TuyauNetworkError } from '@tuyau/core/client'

import { capitalizeFirstLetter } from './string'

/**
 * The JSON an AdonisJS error response carries. Every field is optional because which
 * ones are present depends on who rejected the request: VineJS sends
 * `{ type: 'validation', messages }`, controllers hand-write `{ error }` or
 * `{ message }`, and an unhandled exception may send neither.
 */
export interface ServerErrorBody {
  type?: string
  message?: string
  error?: string
  exists?: boolean
  messages?: { message: string }[]
}

/**
 * What a failed API call throws.
 *
 * The API client used to be axios, whose errors nested the response body two levels
 * deep at `err.response.data`. Tuyau parses the body for you and puts it directly on
 * `err.response`, and distinguishes a server that answered with an error status
 * (`TuyauHTTPError`) from one that could not be reached at all (`TuyauNetworkError`) —
 * a case the old shape could only describe as an absent response.
 */
export type ServerErrorResponse = TuyauHTTPError | TuyauNetworkError | Error

/**
 * The parsed error body, when the server answered with one at all. Use this to branch
 * on a specific error the server reports, rather than reaching into the error object.
 */
export function serverErrorBody(err: ServerErrorResponse): ServerErrorBody | undefined {
  if (!(err instanceof TuyauHTTPError)) return undefined
  const body = err.response
  /** A non-JSON error page parses to a string or an ArrayBuffer; neither has fields to read. */
  return body && typeof body === 'object' ? (body as ServerErrorBody) : undefined
}

export function serverErrorResponder(err: ServerErrorResponse, altMessageIfExists = '') {
  const data = serverErrorBody(err)

  /** The server was never reached, so there is no body to explain what went wrong. */
  if (err instanceof TuyauNetworkError) {
    return 'Could not reach the server. Check your connection and try again.'
  }

  if (!data) return err.message

  if (data.type === 'validation') {
    return data.messages?.map((res) => capitalizeFirstLetter(`${res?.message} \n`)).toString() || ''
  }

  if (data.error) {
    return data.error
  }

  if (data.message) {
    return data.message
  }

  if (data.exists) {
    return altMessageIfExists || data.error
  }
}
