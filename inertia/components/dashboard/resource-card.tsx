import { Link } from '@inertiajs/react'
import { IconChevronRight } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'

export interface ResourceCardProps {
  href: string
  /** Icon component (e.g. IconServer from tabler) - will be rendered in the gradient box */
  icon: React.ComponentType<{ className?: string }>
  title: string
  /** Optional subtitle below title (e.g. slug) */
  subtitle?: ReactNode
  /** Optional description or extra content */
  description?: ReactNode
  /** Optional footer (badges, meta, etc.) */
  footer?: ReactNode
  className?: string
}

/**
 * Shared card for dashboard resource lists (e.g. servers/projects, addons).
 * Renders a link card with icon, title, optional subtitle/description/footer and chevron.
 */
export function ResourceCard({
  href,
  icon: Icon,
  title,
  subtitle,
  description,
  footer,
  className,
}: ResourceCardProps) {
  return (
    <Link href={href}>
      <Card
        className={`group relative flex flex-col border-border bg-card transition-all duration-200 hover:border-primary/30 ${className ?? ''}`}>
        <div className='flex w-full flex-col items-stretch gap-4 p-5 text-left'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/20'>
              <Icon className='h-6 w-6' />
            </div>
            <IconChevronRight className='h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
          </div>
          <div className='min-w-0 flex-1 space-y-1'>
            <h3 className='truncate text-base font-semibold tracking-tight text-foreground'>
              {title}
            </h3>
            {subtitle ? <div className='text-xs text-muted-foreground'>{subtitle}</div> : null}
            {description != null ? (
              <div className='text-sm text-muted-foreground'>{description}</div>
            ) : null}
          </div>
          {footer ? <div className='flex flex-wrap items-center gap-2'>{footer}</div> : null}
        </div>
      </Card>
    </Link>
  )
}
