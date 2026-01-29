import type { ReactNode } from 'react'

export interface DontShowIfProps {
  condition: boolean
  children: ReactNode
  fallback?: ReactNode
}

export const DontShowIf = ({ condition, children, fallback = null }: DontShowIfProps) => {
  if (!condition) {
    return <>{children}</>
  }
  return <>{fallback}</>
}

DontShowIf.displayName = 'DontShowIf'
