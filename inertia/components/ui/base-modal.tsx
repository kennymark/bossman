'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HStack } from '@/components/ui/hstack'

export interface BaseModalProps {
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

export function BaseModal({
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
  secondaryVariant = 'outline',
  primaryDisabled = false,
  secondaryDisabled = false,
  isLoading = false,
  children,
  className,
  showSecondary = true,
}: BaseModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange || (() => { }) : setInternalOpen

  const contentRef = useRef<HTMLDivElement>(null)

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children && (
          <div ref={contentRef} className='py-4'>
            {children}
          </div>
        )}
        <DialogFooter>
          <HStack spacing={2} justify='end' className='w-full'>
            {showSecondary && (
              <Button
                type='button'
                variant={secondaryVariant}
                onClick={handleSecondaryAction}
                disabled={secondaryDisabled || isLoading}>
                {secondaryText}
              </Button>
            )}
            <Button
              type='button'
              variant={primaryVariant}
              onClick={handlePrimaryAction}
              disabled={primaryDisabled || isLoading}
              isLoading={isLoading}
              loadingText='Loading...'>
              {primaryText}
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
