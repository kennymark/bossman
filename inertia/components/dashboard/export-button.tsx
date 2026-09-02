import { IconDownload } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type QueryValue = string | number | boolean | null | undefined

export interface ExportButtonProps {
  /** The export endpoint, e.g. `/api/v1/orgs/export`. */
  href: string
  /**
   * The page's current filters. Empty strings, `null`, `undefined` and `false` are
   * dropped: the server treats an absent flag as off, and a clean URL is easier to
   * read back from the audit trail.
   */
  query?: Record<string, QueryValue>
  label?: string
  className?: string
}

/** `href` plus the non-empty entries of `query`, as the browser will request it. */
export function buildExportUrl(href: string, query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '' || value === false) continue
    params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `${href}?${search}` : href
}

/**
 * A CSV download for a list page.
 *
 * A real navigation, not a fetch: the browser handles the `Content-Disposition`
 * attachment and the response never has to pass through JavaScript. The tooltip tells
 * the operator what they are about to do — the export is capped and it is logged.
 */
export function ExportButton({ href, query, label = 'Export CSV', className }: ExportButtonProps) {
  const url = buildExportUrl(href, query)

  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn('inline-flex', className)} />}>
        <Button variant='outline' size='sm' asChild>
          <a href={url} download>
            <IconDownload className='h-4 w-4' />
            {label}
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom'>Up to 5,000 rows; recorded in the audit trail</TooltipContent>
    </Tooltip>
  )
}
