import type { LucideIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
      {...props}>
      {Icon && (
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
          <Icon className='h-6 w-6 text-muted-foreground' />
        </div>
      )}
      {title && <h3 className='mt-4 text-lg font-semibold text-foreground'>{title}</h3>}
      {description && <p className='mt-2 text-sm text-muted-foreground max-w-sm'>{description}</p>}
      {children && <div className='mt-6'>{children}</div>}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  ),
)
EmptyState.displayName = 'EmptyState'

export { EmptyState }
