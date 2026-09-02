import { IconAlertTriangle, IconCircleCheck, IconClock, IconInfinity } from '@tabler/icons-react'

import { timeAgo } from '#utils/date'
import { classifyDocumentExpiry } from '#utils/document_expiry'
import { Badge } from '@/components/ui/badge'
import { dateFormatter } from '@/lib/date'

export interface DocumentExpiryBadgeProps {
  expiresAt: string | null | undefined
}

/** Colours a document by how close it is to expiring; the exact date is in the tooltip. */
export function DocumentExpiryBadge({ expiresAt }: DocumentExpiryBadgeProps) {
  const state = classifyDocumentExpiry(expiresAt)
  const title = expiresAt ? dateFormatter(expiresAt) : undefined
  const relative = expiresAt ? timeAgo(expiresAt) : ''

  switch (state) {
    case 'expired':
      return (
        <Badge variant='destructive' className='gap-1' title={title}>
          <IconAlertTriangle className='h-3 w-3' />
          Expired {relative}
        </Badge>
      )
    case 'expiring_30':
      return (
        <Badge variant='warning' className='gap-1' title={title}>
          <IconClock className='h-3 w-3' />
          Expires {relative}
        </Badge>
      )
    case 'expiring_90':
      return (
        <Badge variant='info' className='gap-1' title={title}>
          <IconClock className='h-3 w-3' />
          Expires {relative}
        </Badge>
      )
    case 'valid':
      return (
        <Badge variant='success' className='gap-1' title={title}>
          <IconCircleCheck className='h-3 w-3' />
          Expires {relative}
        </Badge>
      )
    default:
      return (
        <Badge variant='outline' className='gap-1'>
          <IconInfinity className='h-3 w-3' />
          No expiry
        </Badge>
      )
  }
}
