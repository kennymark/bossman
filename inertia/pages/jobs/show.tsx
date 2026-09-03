import type { SharedProps } from '@adonisjs/inertia/types'
import { Link, router, usePage } from '@inertiajs/react'
import { IconPlayerPlay, IconRefresh, IconSearchOff, IconTrash } from '@tabler/icons-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TuyauHTTPError } from '@tuyau/core/client'
import { useState } from 'react'

import type { JobDetail } from '#types/jobs'
import { timeAgo } from '#utils/date'
import { jobDisplayName } from '#utils/jobs'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import DetailRow from '@/components/dashboard/detail-row'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton } from '@/components/ui/loading'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { dateTimeFormatter } from '@/lib/date'
import api from '@/lib/http'

import {
  DeleteJobDialog,
  type JobTarget,
  RerunJobDialog,
  useCanMutateJobs,
} from './components/job-action-dialogs'
import { JobStatusBadge } from './components/job-status-badge'
import { JobStoreError } from './components/store-state'

interface JobShowProps extends SharedProps {
  jobId: string
}

function When({ value }: { value: string | null }) {
  if (!value) return <span className='text-muted-foreground'>—</span>
  return (
    <span>
      {dateTimeFormatter(value, 'short')}{' '}
      <span className='text-xs text-muted-foreground'>({timeAgo(value)})</span>
    </span>
  )
}

function JsonBlock({ value }: { value: unknown }) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <pre className='max-h-[32rem] overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap break-all'>
      {text}
    </pre>
  )
}

function previousJobIdOf(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const value = (data as Record<string, unknown>).previousJobId
  return typeof value === 'string' && value ? value : null
}

/**
 * One job from the store: its payload, result and every timestamp Agenda keeps.
 */
export default function JobShow({ jobId }: JobShowProps) {
  const page = usePage<SharedProps>()
  const appEnv = page.props.appEnv
  const queryClient = useQueryClient()
  const { canMutate } = useCanMutateJobs()
  const [rerunTarget, setRerunTarget] = useState<JobTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobTarget | null>(null)

  const query = useQuery({
    queryKey: ['jobs', appEnv, 'detail', jobId],
    queryFn: async () => (await api.jobs.detail({ params: { id: jobId } })) as unknown as JobDetail,
    retry: false,
  })

  const job = query.data
  const notFound = query.error instanceof TuyauHTTPError && query.error.status === 404
  const previousJobId = job ? previousJobIdOf(job.data) : null

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['jobs', appEnv] })

  return (
    <DashboardPage
      title={job ? jobDisplayName(job.name) : 'Job'}
      description={<code className='text-xs'>{jobId}</code>}
      backHref='/jobs'
      actions={
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='md' leftIcon={<IconRefresh />} onClick={refresh}>
            Refresh
          </Button>
          <Button
            variant='outline'
            size='md'
            leftIcon={<IconPlayerPlay />}
            disabled={!job || !canMutate}
            onClick={() => job && setRerunTarget({ id: job.id, name: job.name })}>
            Re-run
          </Button>
          <Button
            variant='destructive'
            size='md'
            leftIcon={<IconTrash />}
            disabled={!job || !canMutate}
            onClick={() => job && setDeleteTarget({ id: job.id, name: job.name })}>
            Delete
          </Button>
        </div>
      }>
      {query.isLoading && <LoadingSkeleton type='card' count={3} />}

      {notFound && (
        <AppCard title='Not found'>
          <EmptyState
            icon={IconSearchOff}
            title='No such job'
            description={`Nothing in the ${appEnv} job store has this id. It may have been deleted, or it may belong to the other environment.`}
            action={
              <Button variant='outline' asChild>
                <Link href='/jobs'>Back to jobs</Link>
              </Button>
            }
          />
        </AppCard>
      )}

      {query.isError && !notFound && <JobStoreError error={query.error} />}

      {job && (
        <>
          <AppCard title='Overview' description='What the store knows about this job'>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
              <DetailRow label='Status' value={<JobStatusBadge status={job.status} />} />
              <DetailRow label='Type' value={job.type} />
              <DetailRow label='Priority' value={job.priority} />
              <DetailRow
                label='Repeat interval'
                value={
                  job.repeatInterval ? <code className='text-xs'>{job.repeatInterval}</code> : null
                }
              />
              <DetailRow label='Repeat timezone' value={job.repeatTimezone} />
              <DetailRow
                label='Failures'
                value={
                  job.failCount > 0 ? (
                    <span className='text-destructive'>{job.failCount}</span>
                  ) : (
                    '0'
                  )
                }
              />
              <DetailRow label='Runs' value={job.runCount} />
              <DetailRow label='Finished' value={job.finishedCount} />
              <DetailRow
                label='Progress'
                value={job.progress === null ? null : `${job.progress}%`}
              />
              <DetailRow label='Saves result' value={job.shouldSaveResult ? 'Yes' : 'No'} />
              <DetailRow label='Last modified by' value={job.lastModifiedBy} />
              <DetailRow
                label='Flags'
                value={
                  <div className='flex flex-wrap gap-1'>
                    {job.disabled && <Badge variant='outline'>Disabled</Badge>}
                    {job.isRerun && <Badge variant='indigo'>Re-run</Badge>}
                    {!job.disabled && !job.isRerun && (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </div>
                }
              />
              {previousJobId && (
                <DetailRow
                  label='Re-run of'
                  value={
                    <Link
                      href={`/jobs/${previousJobId}`}
                      className='font-mono text-xs hover:underline'>
                      {previousJobId}
                    </Link>
                  }
                />
              )}
            </SimpleGrid>
          </AppCard>

          <AppCard title='Timeline' description='Timestamps as recorded by the worker'>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
              <DetailRow label='Last run started' value={<When value={job.lastRunAt} />} />
              <DetailRow label='Last finished' value={<When value={job.lastFinishedAt} />} />
              <DetailRow label='Next run' value={<When value={job.nextRunAt} />} />
              <DetailRow label='Locked at' value={<When value={job.lockedAt} />} />
              <DetailRow label='Failed at' value={<When value={job.failedAt} />} />
            </SimpleGrid>
          </AppCard>

          {job.failReason && (
            <AppCard title='Last failure' description='Reason recorded by the worker'>
              <JsonBlock value={job.failReason} />
            </AppCard>
          )}

          <AppCard title='Data' description='The job payload. Credential-shaped keys are redacted.'>
            {job.data === null || job.data === undefined ? (
              <p className='text-sm text-muted-foreground'>No payload.</p>
            ) : (
              <JsonBlock value={job.data} />
            )}
          </AppCard>

          {job.result !== null && job.result !== undefined && (
            <AppCard title='Result' description='Saved because the job asked for it'>
              <JsonBlock value={job.result} />
            </AppCard>
          )}
        </>
      )}

      <RerunJobDialog
        job={rerunTarget}
        onOpenChange={() => setRerunTarget(null)}
        onDone={(result) => {
          refresh()
          router.visit(`/jobs/${result.newJobId}`)
        }}
      />
      <DeleteJobDialog
        job={deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onDone={() => {
          refresh()
          router.visit('/jobs')
        }}
      />
    </DashboardPage>
  )
}
