import type { JobStatus } from '#utils/jobs'
import { Badge, type BadgeProps } from '@/components/ui/badge'

const STATUS_META: Record<JobStatus, { label: string; variant: BadgeProps['variant'] }> = {
  running: { label: 'Running', variant: 'info' },
  failed: { label: 'Failed', variant: 'destructive' },
  queued: { label: 'Queued', variant: 'warning' },
  scheduled: { label: 'Scheduled', variant: 'cyan' },
  completed: { label: 'Completed', variant: 'success' },
  idle: { label: 'Idle', variant: 'outline' },
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.idle
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
