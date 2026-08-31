'use client'

import type * as React from 'react'

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

/** Shared props for confirm/cancel overlay components (BaseModal, BaseDialog, BaseSheet). */
export interface BaseOverlayProps {
  title: string
  description?: React.ReactNode
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onPrimaryAction?: () => void | Promise<void>
  onSecondaryAction?: () => void
  primaryText?: string
  secondaryText?: string
  primaryVariant?: ButtonVariant
  secondaryVariant?: ButtonVariant
  primaryDisabled?: boolean
  secondaryDisabled?: boolean
  isLoading?: boolean
  children?: React.ReactNode
  className?: string
  showSecondary?: boolean
}

/** Sheet-specific extension (side, showFooter, contentStyle; title/description as ReactNode). */
export interface BaseSheetOverlayProps extends BaseOverlayProps {
  side?: 'left' | 'right' | 'top' | 'bottom'
  showFooter?: boolean
  contentStyle?: React.CSSProperties
  title?: React.ReactNode
  description?: React.ReactNode
}
