'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export interface BaseDialogProps {
  title: string
  description?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onPrimaryAction?: () => void | Promise<void>
  onSecondaryAction?: () => void
  primaryText?: string
  secondaryText?: string
  primaryVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  secondaryVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
  isLoading?: boolean
  children?: React.ReactNode
  className?: string
  showSecondary?: boolean
}

export function BaseDialog({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  onPrimaryAction,
  onSecondaryAction,
  primaryText = 'Confirm',
  secondaryText = 'Cancel',
  primaryVariant = 'default',
  secondaryVariant: _secondaryVariant = 'outline', // Reserved for future use
  primaryDisabled = false,
  secondaryDisabled = false,
  isLoading = false,
  children,
  className,
  showSecondary = true,
}: BaseDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange || (() => { }) : setInternalOpen

  const contentRef = React.useRef<HTMLDivElement>(null)

  const handlePrimaryAction = async () => {
    // If there's a form in children, submit it
    if (children && contentRef.current) {
      const form = contentRef.current.querySelector('form')
      if (form) {
        form.requestSubmit()
        return
      }
    }

    if (onPrimaryAction) {
      await onPrimaryAction()
    }
    if (!isControlled) {
      setInternalOpen(false)
    }
  }

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction()
    }
    if (!isControlled) {
      setInternalOpen(false)
    } else if (onOpenChange) {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <AlertDialogTrigger asChild>
          {React.isValidElement(trigger) ? trigger : <span>{trigger}</span>}
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent className={className}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children && (
          <div ref={contentRef} className='py-4'>
            {children}
          </div>
        )}
        <AlertDialogFooter>
          {showSecondary && (
            <AlertDialogCancel
              onClick={handleSecondaryAction}
              disabled={secondaryDisabled || isLoading}>
              {secondaryText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handlePrimaryAction}
            disabled={primaryDisabled || isLoading}
            type='button'
            className={cn(
              primaryVariant === 'destructive' &&
              'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}>
            {isLoading ? 'Loading...' : primaryText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
