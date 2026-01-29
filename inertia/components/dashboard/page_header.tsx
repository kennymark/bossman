import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  backHref?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, backHref, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className='flex items-center gap-4 min-w-0'>
        {backHref ? (
          <Button variant='ghost' size='icon' asChild>
            <Link href={backHref} aria-label='Back'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
        ) : null}

        <div className='min-w-0'>
          <h1 className='text-3xl font-bold tracking-tight truncate'>{title}</h1>
          {description ? <p className='text-muted-foreground truncate'>{description}</p> : null}
        </div>
      </div>

      {actions ? <div className='flex flex-wrap items-center gap-2'>{actions}</div> : null}
    </div>
  )
}

