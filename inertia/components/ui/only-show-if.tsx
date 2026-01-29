import type { ReactNode } from 'react'

export interface OnlyShowIfProps {
  condition: boolean
  children: ReactNode
  fallback?: ReactNode
}

export const OnlyShowIf = ({ condition, children, fallback = null }: OnlyShowIfProps) => {
  if (condition) {
    return <>{children}</>
  }
  return <>{fallback}</>
}

OnlyShowIf.displayName = 'OnlyShowIf'
