import { IconAlertTriangle, IconCircleCheck, IconClock, IconHelpCircle } from '@tabler/icons-react'

import { formatFileSize } from '#utils/functions'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type BackupHealthStatus = 'healthy' | 'stale' | 'critical' | 'unknown'

export interface BackupHealthEnvironment {
  appEnv: 'dev' | 'prod'
  status: BackupHealthStatus
  ageHours: number | null
  lastSuccessAt: string | null
  lastSuccessSize: number | null
  lastRunAt: string | null
  lastRunStatus: 'running' | 'success' | 'failed' | null
  lastError: string | null
  consecutiveFailures: number
  history: {
    id: number
    status: string
    fileSize: number | null
    durationMs: number | null
    startedAt: string | null
    error: string | null
  }[]
}

export interface BackupHealthProps {
  environments: BackupHealthEnvironment[]
  /** True when the health log could not be read at all — see `buildHealth`. */
  unavailable?: boolean
}

const STATUS_COPY: Record<BackupHealthStatus, { label: string; hint: string }> = {
  healthy: { label: 'Healthy', hint: 'A recent backup completed successfully.' },
  stale: { label: 'Stale', hint: 'The last successful backup is older than expected.' },
  critical: { label: 'At risk', hint: 'No recent successful backup. Investigate now.' },
  unknown: { label: 'No data', hint: 'No backup run has been recorded yet.' },
}

const STATUS_STYLES: Record<BackupHealthStatus, string> = {
  healthy: 'text-emerald-600 dark:text-emerald-400',
  stale: 'text-amber-600 dark:text-amber-400',
  critical: 'text-destructive',
  unknown: 'text-muted-foreground',
}

function StatusIcon({ status }: { status: BackupHealthStatus }) {
  const className = cn('h-5 w-5', STATUS_STYLES[status])
  if (status === 'healthy') return <IconCircleCheck className={className} />
  if (status === 'stale') return <IconClock className={className} />
  if (status === 'critical') return <IconAlertTriangle className={className} />
  return <IconHelpCircle className={className} />
}

function formatAge(ageHours: number | null): string {
  if (ageHours === null) return 'never'
  if (ageHours < 1) return `${Math.round(ageHours * 60)} min ago`
  if (ageHours < 48) return `${Math.round(ageHours)}h ago`
  return `${Math.round(ageHours / 24)}d ago`
}

/**
 * Backup health per environment.
 *
 * Reads the `backup_runs` log rather than the list of stored backups: a failed run
 * never produced a backup row, so a database could go weeks without a usable dump
 * while this page happily listed the last successful one.
 */
export function BackupHealth({ environments, unavailable }: BackupHealthProps) {
  return (
    <div className='space-y-3'>
      {unavailable && (
        <div className='rounded-md border border-amber-500/40 bg-amber-500/5 p-3'>
          <p className='text-sm font-medium text-amber-700 dark:text-amber-400'>
            Backup health is unavailable
          </p>
          <p className='text-xs text-muted-foreground mt-1'>
            The backup run log could not be read. If this is a fresh deploy, run{' '}
            <code className='font-mono'>node ace migration:run</code>. Backups themselves are
            unaffected — the list below is live.
          </p>
        </div>
      )}
      <div className='grid gap-4 sm:grid-cols-2'>
        {environments.map((env) => (
          <AppCard
            key={env.appEnv}
            title={env.appEnv === 'prod' ? 'Production' : 'Development'}
            description={STATUS_COPY[env.status].hint}>
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <StatusIcon status={env.status} />
                <div>
                  <p
                    className={cn('text-lg font-semibold leading-none', STATUS_STYLES[env.status])}>
                    {STATUS_COPY[env.status].label}
                  </p>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Last success {formatAge(env.ageHours)}
                    {env.lastSuccessSize ? ` · ${formatFileSize(env.lastSuccessSize)}` : ''}
                  </p>
                </div>
              </div>

              {env.consecutiveFailures > 0 && (
                <div className='rounded-md border border-destructive/40 bg-destructive/5 p-3'>
                  <p className='text-sm font-medium text-destructive'>
                    {env.consecutiveFailures} consecutive failure
                    {env.consecutiveFailures === 1 ? '' : 's'}
                  </p>
                  {env.lastError && (
                    <p className='text-xs font-mono text-muted-foreground mt-1 break-all line-clamp-3'>
                      {env.lastError}
                    </p>
                  )}
                </div>
              )}

              {env.history.length > 0 && (
                <div>
                  <p className='text-xs text-muted-foreground mb-2'>Recent runs (oldest first)</p>
                  <div
                    className='flex items-end gap-1 h-10'
                    role='img'
                    aria-label={`Recent ${env.appEnv} backup runs`}>
                    {env.history.map((run) => (
                      <span
                        key={run.id}
                        title={`${run.status}${run.startedAt ? ` · ${new Date(run.startedAt).toLocaleString()}` : ''}${run.error ? ` · ${run.error}` : ''}`}
                        className={cn(
                          'flex-1 min-w-[4px] rounded-sm',
                          run.status === 'success'
                            ? 'bg-emerald-500/70 h-full'
                            : run.status === 'failed'
                              ? 'bg-destructive/80 h-full'
                              : 'bg-muted-foreground/40 h-1/2',
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {env.lastRunStatus && (
                <Badge variant={env.lastRunStatus === 'failed' ? 'destructive' : 'secondary'}>
                  Last run: {env.lastRunStatus}
                </Badge>
              )}
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  )
}
