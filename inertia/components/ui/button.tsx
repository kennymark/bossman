import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 px-2 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90',
        destructive: 'bg-red-300 text-gray-800 hover:bg-destructive/90',
        outline:
          'border border-input bg-secondary hover:bg-secondary/80 hover:text-secondary-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8  px-2',
        md: 'h-9  px-2',
        lg: 'h-11  px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isLoading?: boolean
  loadingText?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      leftIcon,
      rightIcon,
      isLoading = false,
      loadingText,
      disabled,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(disabled || isLoading)
    const resolvedLeftIcon = isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : leftIcon
    const resolvedRightIcon = !isLoading ? rightIcon : null

    const rootClassName = cn(
      buttonVariants({ variant, size, className }),
      isLoading && 'pointer-events-none cursor-wait',
    )

    if (asChild) {
      if (!React.isValidElement(children)) return null

      const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>

      const childContent = isLoading ? (loadingText ?? child.props.children) : child.props.children

      const mergedOnClick = (event: unknown) => {
        if (isDisabled) return
        child.props.onClick?.(event as never)
        onClick?.(event as never)
      }

      return React.cloneElement(child, {
        ...props,
        className: cn(rootClassName, child.props.className),
        onClick: mergedOnClick,
        'aria-disabled': isDisabled ? true : undefined,
        'aria-busy': isLoading ? true : undefined,
        children: (
          <>
            {resolvedLeftIcon ? <span className='shrink-0'>{resolvedLeftIcon}</span> : null}
            {childContent}
            {resolvedRightIcon ? <span className='shrink-0'>{resolvedRightIcon}</span> : null}
          </>
        ),
      })
    }

    const handleRootClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      if (isDisabled) {
        event.preventDefault()
        return
      }
      onClick?.(event)
    }

    return (
      <button
        className={rootClassName}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled ? true : undefined}
        aria-busy={isLoading ? true : undefined}
        onClick={handleRootClick}
        {...props}>
        {resolvedLeftIcon ? <span className='shrink-0'>{resolvedLeftIcon}</span> : null}
        {isLoading ? (loadingText ?? children) : children}
        {resolvedRightIcon ? <span className='shrink-0'>{resolvedRightIcon}</span> : null}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
