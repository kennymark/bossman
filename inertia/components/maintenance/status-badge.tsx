import { IconCircleCheck, IconClock, IconPlayerPause, IconProgress } from '@tabler/icons-react'

import { MAINTENANCE_STATUS_LABELS } from '#utils/maintenance_status'
import { Badge } from '@/components/ui/badge'

export interface MaintenanceStatusBadgeProps {
  status: string | null | undefined
}

/** Renders a maintenance request status (todo, in_progress, complete, postponed). */
export function MaintenanceStatusBadge({ status }: MaintenanceStatusBadgeProps) {
  switch (status) {
    case 'todo':
      return (
        <Badge variant='outline' className='gap-1'>
          <IconClock className='h-3 w-3' />
          {MAINTENANCE_STATUS_LABELS.todo}
        </Badge>
      )
    case 'in_progress':
      return (
        <Badge variant='info' className='gap-1'>
          <IconProgress className='h-3 w-3' />
          {MAINTENANCE_STATUS_LABELS.in_progress}
        </Badge>
      )
    case 'complete':
      return (
        <Badge variant='success' className='gap-1'>
          <IconCircleCheck className='h-3 w-3' />
          {MAINTENANCE_STATUS_LABELS.complete}
        </Badge>
      )
    case 'postponed':
      return (
        <Badge variant='warning' className='gap-1'>
          <IconPlayerPause className='h-3 w-3' />
          {MAINTENANCE_STATUS_LABELS.postponed}
        </Badge>
      )
    default:
      return <Badge variant='outline'>{status ?? '—'}</Badge>
  }
}
