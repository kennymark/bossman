'use client'

import { useRef, useState } from 'react'

import type { BaseSheetOverlayProps } from '@/components/ui/base-overlay-types'
import { Button } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export type BaseSheetProps = BaseSheetOverlayProps

export function BaseSheet({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  side = 'right',
  onPrimaryAction,
  onSecondaryAction,
  primaryText = 'Confirm',
  secondaryText = 'Cancel',
  primaryVariant = 'default',
  secondaryVariant = 'outline',
  primaryDisabled = false,
  secondaryDisabled = false,
  isLoading = false,
  showSecondary = true,
  showFooter = false,
  children,
  className,
  contentStyle,
}: BaseSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen

  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrimaryAction = async () => {
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

  const hasFooter = showFooter

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {trigger != null && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side={side} className={className} style={contentStyle}>
        {(title != null || description != null) && (
          <SheetHeader>
            {title != null && <SheetTitle>{title}</SheetTitle>}
            {description != null && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        {children != null && (
          <div
            ref={contentRef}
            className={title != null || description != null ? 'mt-6' : undefined}>
            {children}
          </div>
        )}
        {hasFooter && (
          <SheetFooter className='mt-6'>
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
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
