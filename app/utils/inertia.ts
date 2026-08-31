import type { HttpContext } from '@adonisjs/core/http'

/**
 * Typed wrapper around inertia.render so controllers don't repeat the cast.
 * Use: return renderInertia(inertia, 'servers/index', { sort })
 */
export function renderInertia(
  inertia: HttpContext['inertia'],
  page: string,
  props: object,
): ReturnType<HttpContext['inertia']['render']> {
  return (
    inertia.render as (page: string, props: object) => ReturnType<HttpContext['inertia']['render']>
  )(page, props)
}
