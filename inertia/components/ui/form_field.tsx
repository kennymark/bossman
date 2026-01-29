import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: ReactNode
  htmlFor?: string
  required?: boolean
  description?: ReactNode
  error?: ReactNode
  className?: string
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  required = false,
  description,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className='space-y-1'>
        <Label htmlFor={htmlFor}>
          {label}
          {required ? ' *' : null}
        </Label>
        {description ? <div className='text-xs text-muted-foreground'>{description}</div> : null}
      </div>

      {children}

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
    </div>
  )
}

