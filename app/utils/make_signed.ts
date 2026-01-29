import type { Request } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'

interface MakeSignedUrlProps {
  appUrl: string
  params?: Record<string, string>
  expiresIn: string
  path: string
  qs: Record<string, string>
}

/**
 *
 * @param props
 * @example
 * ```ts
 * makeSignedUrl({
 *  appUrl: 'https://app.togetha.co.uk',
 *  expiresIn: '1h',
 *  path: 'auth/join',
 *  qs: { email: 'test@example.com' },
 * })
 * ```
 */
export function makeSignedUrl(props: MakeSignedUrlProps) {
  const url = router
    .builder()
    .prefixUrl(props.appUrl)
    .params(props.params)
    .qs(props.qs)
    .makeSigned(props.path, { expiresIn: props.expiresIn })

  return url
}

export function verifySignedUrl(request: Request) {
  return request.hasValidSignature()
}
