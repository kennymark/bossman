import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

export type LoadingVariant = 'spinner' | 'skeleton' | 'inline' | 'overlay' | 'card'

interface BaseLoadingProps {
  className?: string
}

interface SpinnerLoadingProps extends BaseLoadingProps {
  variant?: 'spinner'
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

interface SkeletonLoadingProps extends BaseLoadingProps {
  variant: 'skeleton'
  type?: 'list' | 'card' | 'table' | 'custom'
  count?: number
  children?: React.ReactNode
}

interface InlineLoadingProps extends BaseLoadingProps {
  variant: 'inline'
  size?: 'sm' | 'md' | 'lg'
}

interface OverlayLoadingProps extends BaseLoadingProps {
  variant: 'overlay'
  text?: string
}

interface CardLoadingProps extends BaseLoadingProps {
  variant: 'card'
  title?: string
  description?: string
  itemCount?: number
}

type LoadingProps =
  | SpinnerLoadingProps
  | SkeletonLoadingProps
  | InlineLoadingProps
  | OverlayLoadingProps
  | CardLoadingProps

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

function Spinner({ size = 'md', text, className }: Omit<SpinnerLoadingProps, 'variant'>) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {text && <p className='text-sm text-muted-foreground'>{text}</p>}
    </div>
  )
}

function SkeletonList({ count = 5 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        id: Math.random().toString(36).substring(2, 9),
      })),
    [count],
  )

  return (
    <div className='space-y-4'>
      {items.map((item) => (
        <div key={item.id} className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonCard({ count = 3 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        id: Math.random().toString(36).substring(2, 9),
      })),
    [count],
  )

  return (
    <div className='space-y-4'>
      {items.map((item) => (
        <div key={item.id} className='flex items-center gap-4'>
          <Skeleton className='h-12 w-12 rounded' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonTable({ count = 5 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        id: Math.random().toString(36).substring(2, 9),
      })),
    [count],
  )

  return (
    <div className='space-y-3'>
      {items.map((item) => (
        <div key={item.id} className='flex items-center gap-4'>
          <Skeleton className='h-10 w-full' />
        </div>
      ))}
    </div>
  )
}

function SkeletonContent({
  type = 'list',
  count = 5,
  children,
}: {
  type?: 'list' | 'card' | 'table' | 'custom'
  count?: number
  children?: React.ReactNode
}) {
  if (children) {
    return <>{children}</>
  }

  switch (type) {
    case 'list':
      return <SkeletonList count={count} />
    case 'card':
      return <SkeletonCard count={count} />
    case 'table':
      return <SkeletonTable count={count} />
    default:
      return <SkeletonList count={count} />
  }
}

export function Loading(props: LoadingProps) {
  const variant = props.variant ?? 'spinner'
  const className = props.className

  if (variant === 'spinner') {
    const spinnerProps = props as SpinnerLoadingProps
    return <Spinner size={spinnerProps.size} text={spinnerProps.text} className={className} />
  }

  if (variant === 'skeleton') {
    const skeletonProps = props as SkeletonLoadingProps
    return (
      <div className={className}>
        <SkeletonContent
          type={skeletonProps.type}
          count={skeletonProps.count}
          children={skeletonProps.children}
        />
      </div>
    )
  }

  if (variant === 'inline') {
    const inlineProps = props as InlineLoadingProps
    const size = inlineProps.size ?? 'sm'
    return (
      <div className={cn('inline-flex items-center justify-center', className)}>
        <Loader2 className={cn('animate-spin text-primary', sizeMap[size as keyof typeof sizeMap])} />
      </div>
    )
  }

  if (variant === 'overlay') {
    const overlayProps = props as OverlayLoadingProps
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
          className,
        )}>
        <div className='flex flex-col items-center justify-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          {overlayProps.text && <p className='text-sm text-muted-foreground'>{overlayProps.text}</p>}
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    const cardProps = props as CardLoadingProps
    return (
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        {(cardProps.title || cardProps.description) && (
          <div className='mb-6 space-y-1'>
            {cardProps.title && <h3 className='text-lg font-semibold'>{cardProps.title}</h3>}
            {cardProps.description && (
              <p className='text-sm text-muted-foreground'>{cardProps.description}</p>
            )}
          </div>
        )}
        <SkeletonList count={cardProps.itemCount ?? 5} />
      </div>
    )
  }

  return <Spinner className={className} />
}

// Convenience exports for common patterns
export function LoadingSpinner(props: Omit<SpinnerLoadingProps, 'variant'>) {
  return <Loading variant='spinner' {...props} />
}

export function LoadingSkeleton(props: Omit<SkeletonLoadingProps, 'variant'>) {
  return <Loading variant='skeleton' {...props} />
}

export function LoadingInline(props: Omit<InlineLoadingProps, 'variant'>) {
  return <Loading variant='inline' {...props} />
}

export function LoadingOverlay(props: Omit<OverlayLoadingProps, 'variant'>) {
  return <Loading variant='overlay' {...props} />
}

export function LoadingCard(props: Omit<CardLoadingProps, 'variant'>) {
  return <Loading variant='card' {...props} />
}
