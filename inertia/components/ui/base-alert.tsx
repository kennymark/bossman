'use client'

import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { HStack } from '@/components/ui/hstack'
import { Stack } from '@/components/ui/stack'

export interface BaseAlertProps {
  title?: string
  description?: ReactNode
  variant?: 'default' | 'destructive' | 'success'
  icon?: ReactNode
  primaryText?: string
  secondaryText?: string
  onPrimary?: () => void | Promise<void>
  onSecondary?: () => void
  primaryVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  secondaryVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
  isLoading?: boolean
  showPrimary?: boolean
  showSecondary?: boolean
  className?: string
  children?: ReactNode
}

export const BaseAlert = ({
  title,
  description,
  variant = 'default',
  icon,
  primaryText,
  secondaryText,
  onPrimary,
  onSecondary,
  primaryVariant = 'default',
  secondaryVariant = 'outline',
  primaryDisabled = false,
  secondaryDisabled = false,
  isLoading = false,
  showPrimary = false,
  showSecondary = false,
  className,
  children,
}: BaseAlertProps) => {
  const hasActions = showPrimary || showSecondary

  return (
    <Alert variant={variant} className={className}>
      {icon && <>{icon}</>}
      <Stack spacing={2}>
        {title && <AlertTitle>{title}</AlertTitle>}
        {(description || children) && (
          <AlertDescription>
            {description}
            {children}
          </AlertDescription>
        )}
        {hasActions && (
          <HStack spacing={2} className='mt-4'>
            {showSecondary && (
              <Button
                type='button'
                variant={secondaryVariant}
                onClick={onSecondary}
                disabled={secondaryDisabled || isLoading}
                size='sm'>
                {secondaryText}
              </Button>
            )}
            {showPrimary && (
              <Button
                type='button'
                variant={primaryVariant}
                onClick={onPrimary}
                disabled={primaryDisabled || isLoading}
                isLoading={isLoading}
                loadingText='Loading...'
                size='sm'>
                {primaryText}
              </Button>
            )}
          </HStack>
        )}
      </Stack>
    </Alert>
  )
}

BaseAlert.displayName = 'BaseAlert'
