import { IconAlertTriangle, IconArrowDown, IconMinus } from '@tabler/icons-react'

import { MAINTENANCE_SEVERITY_LABELS } from '#utils/maintenance_status'
import { Badge } from '@/components/ui/badge'

export interface MaintenanceSeverityBadgeProps {
  severity: string | null | undefined
}

/** Renders a maintenance request severity (low, moderate, high). */
export function MaintenanceSeverityBadge({ severity }: MaintenanceSeverityBadgeProps) {
  switch (severity) {
    case 'low':
      return (
        <Badge variant='secondary' className='gap-1'>
          <IconArrowDown className='h-3 w-3' />
          {MAINTENANCE_SEVERITY_LABELS.low}
        </Badge>
      )
    case 'moderate':
      return (
        <Badge variant='warning' className='gap-1'>
          <IconMinus className='h-3 w-3' />
          {MAINTENANCE_SEVERITY_LABELS.moderate}
        </Badge>
      )
    case 'high':
      return (
        <Badge variant='destructive' className='gap-1'>
          <IconAlertTriangle className='h-3 w-3' />
          {MAINTENANCE_SEVERITY_LABELS.high}
        </Badge>
      )
    default:
      return <Badge variant='outline'>{severity ?? '—'}</Badge>
  }
}
