import { IconAlertCircle } from '@tabler/icons-react'
import type { ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { dateFormatter } from '@/lib/date'

export interface DataAccessExpiredAlertProps {
  /** Whether data access has expired */
  expired: boolean
  /** Optional date when access expired (for display) */
  expiredAt?: string | null
  /** Override title */
  title?: ReactNode
  /** Override description */
  description?: ReactNode
}

const defaultTitle = 'Access expired'
const defaultDescription = (expiredAt: string | null | undefined) =>
  `Your access to properties and leases expired${expiredAt ? ` on ${dateFormatter(expiredAt)}. ` : '. '}Contact your administrator to restore access.`

export function DataAccessExpiredAlert({
  expired,
  expiredAt,
  title = defaultTitle,
  description,
}: DataAccessExpiredAlertProps) {
  if (!expired) return null

  return (
    <Alert variant='destructive'>
      <IconAlertCircle className='h-4 w-4' />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description ?? defaultDescription(expiredAt)}</AlertDescription>
    </Alert>
  )
}
