import { Link } from '@inertiajs/react'
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconChevronRight,
  IconCircleCheck,
  IconInfoCircle,
} from '@tabler/icons-react'

import { timeAgo } from '#utils/date'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export type AttentionSeverity = 'info' | 'warning' | 'critical'

export interface AttentionItem {
  kind: string
  severity: AttentionSeverity
  title: string
  detail: string
  href?: string
  at: string | null
}

export interface AttentionResult {
  items: AttentionItem[]
  counts: { total: number; critical: number; warning: number; info: number }
  degraded: string[]
}

const SEVERITY_ICON = {
  critical: { icon: IconAlertOctagon, className: 'text-destructive' },
  warning: { icon: IconAlertTriangle, className: 'text-quick-action-orange' },
  info: { icon: IconInfoCircle, className: 'text-quick-action-blue' },
} as const

const SEVERITY_BADGE = {
  critical: 'destructive',
  warning: 'warning',
  info: 'info',
} as const

interface AttentionCardProps {
  data?: AttentionResult
  loading: boolean
  error?: boolean
}

export function AttentionCard({ data, loading, error }: AttentionCardProps) {
  const items = data?.items ?? []
  const counts = data?.counts

  const title = (
    <span className='flex items-center gap-2'>
      Needs attention
      {counts && counts.total > 0 && (
        <span className='flex items-center gap-1'>
          {counts.critical > 0 && <Badge variant='destructive'>{counts.critical} critical</Badge>}
          {counts.warning > 0 && <Badge variant='warning'>{counts.warning} warning</Badge>}
          {counts.info > 0 && <Badge variant='info'>{counts.info} info</Badge>}
        </span>
      )}
    </span>
  )

  return (
    <AppCard
      title={title}
      description='Expiring grants, scheduled bans, deletion requests, backup health and failed actions.'>
      {loading ? (
        <div className='space-y-2'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </div>
      ) : error ? (
        <p className='text-sm text-muted-foreground'>Could not load the attention list.</p>
      ) : items.length === 0 ? (
        <div className='flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6'>
          <IconCircleCheck className='h-6 w-6 text-quick-action-green' />
          <div>
            <p className='text-sm font-medium'>All clear</p>
            <p className='text-xs text-muted-foreground'>Nothing needs an operator right now.</p>
          </div>
        </div>
      ) : (
        <ul className='divide-y divide-border'>
          {items.map((item, index) => (
            <AttentionRow key={`${item.kind}-${index}`} item={item} />
          ))}
        </ul>
      )}
      {data && data.degraded.length > 0 && (
        <p className='mt-3 text-xs text-muted-foreground'>
          Unavailable: {data.degraded.join(', ')}.
        </p>
      )}
    </AppCard>
  )
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const { icon: Icon, className } = SEVERITY_ICON[item.severity]
  const body = (
    <>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${className}`} />
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium'>{item.title}</p>
        <p className='truncate text-xs text-muted-foreground'>{item.detail}</p>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        {item.at && <span className='text-xs text-muted-foreground'>{timeAgo(item.at)}</span>}
        <Badge variant={SEVERITY_BADGE[item.severity]} className='capitalize'>
          {item.severity}
        </Badge>
        {item.href && <IconChevronRight className='h-4 w-4 text-muted-foreground' />}
      </div>
    </>
  )
  const rowClass = 'flex items-start gap-3 py-3'
  if (item.href) {
    return (
      <li>
        <Link
          href={item.href}
          className={`${rowClass} -mx-2 rounded-lg px-2 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
          {body}
        </Link>
      </li>
    )
  }
  return <li className={rowClass}>{body}</li>
}
