import type { SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import type { JobRerunResult } from '#types/jobs'
import { CONFIRMATION_PHRASES, MIN_REASON_LENGTH, confirmationMatches } from '#utils/confirmation'
import { jobDisplayName } from '#utils/jobs'
import { BaseModal } from '@/components/ui/base-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Stack } from '@/components/ui/stack'
import { Textarea } from '@/components/ui/textarea'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

/** What a dialog needs to know about the job it acts on. */
export interface JobTarget {
  id: string
  name: string
}

/**
 * Whether this session may re-run or delete here.
 *
 * Production mutations are god-admin only; the server checks again, this only decides
 * whether the dialog offers the button.
 */
export function useCanMutateJobs() {
  const page = usePage<SharedProps>()
  const appEnv = page.props.appEnv
  const isGodAdmin = Boolean(page.props.isGodAdmin)
  return { appEnv, canMutate: appEnv !== 'prod' || isGodAdmin }
}

function ProdNotice() {
  return (
    <div className='flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>
      <IconAlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
      <p>Only a god admin can change jobs in production.</p>
    </div>
  )
}

function ReasonField({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const ok = value.trim().length >= MIN_REASON_LENGTH
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>Reason</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
      />
      {!ok && value.length > 0 && (
        <p className='text-xs text-muted-foreground'>At least {MIN_REASON_LENGTH} characters.</p>
      )}
    </div>
  )
}

export interface RerunJobDialogProps {
  job: JobTarget | null
  onOpenChange: (open: boolean) => void
  onDone?: (result: JobRerunResult) => void
}

/**
 * Re-queue a job. Inserts a clone due now; the original is left as it is.
 */
export function RerunJobDialog({ job, onOpenChange, onDone }: RerunJobDialogProps) {
  const [reason, setReason] = useState('')
  const { appEnv, canMutate } = useCanMutateJobs()

  const close = () => {
    setReason('')
    onOpenChange(false)
  }

  const mutation = useMutation({
    mutationFn: async () =>
      (await api.jobs.rerun({
        params: { id: job?.id ?? '' },
        body: { reason } as never,
      })) as unknown as JobRerunResult,
    onSuccess: (result) => {
      toast.success(`Re-queued ${result.name}`)
      close()
      onDone?.(result)
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Could not re-run this job')
    },
  })

  const reasonOk = reason.trim().length >= MIN_REASON_LENGTH

  return (
    <BaseModal
      open={job !== null}
      onOpenChange={(next) => {
        if (!next) close()
      }}
      title='Re-run job'
      description={
        job
          ? `A new "${jobDisplayName(job.name)}" job will be queued to run immediately in ${appEnv}. The original stays as it is.`
          : undefined
      }
      primaryText='Re-run'
      secondaryText='Cancel'
      onPrimaryAction={() => mutation.mutate()}
      isLoading={mutation.isPending}
      primaryDisabled={!reasonOk || !canMutate}>
      <Stack spacing={4}>
        {!canMutate && <ProdNotice />}
        <ReasonField
          id='rerun-reason'
          value={reason}
          onChange={setReason}
          placeholder='Why is this job being re-run? Recorded in the audit log.'
        />
      </Stack>
    </BaseModal>
  )
}

export interface DeleteJobDialogProps {
  job: JobTarget | null
  onOpenChange: (open: boolean) => void
  onDone?: (job: JobTarget) => void
}

/**
 * Delete a job from the store, behind a typed confirmation.
 *
 * Deleting a recurring job stops its schedule; deleting a queued one means it never
 * runs. Either is irreversible, so the operator retypes the job's name.
 */
export function DeleteJobDialog({ job, onOpenChange, onDone }: DeleteJobDialogProps) {
  const [reason, setReason] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const { appEnv, canMutate } = useCanMutateJobs()

  const expectedPhrase = job ? CONFIRMATION_PHRASES['job.delete'](job.name) : ''

  const close = () => {
    setReason('')
    setConfirmation('')
    onOpenChange(false)
  }

  const mutation = useMutation({
    mutationFn: async () =>
      await api.jobs.destroy({
        params: { id: job?.id ?? '' },
        body: { reason, confirmation } as never,
      }),
    onSuccess: () => {
      const target = job
      toast.success(target ? `Deleted ${target.name}` : 'Job deleted')
      close()
      if (target) onDone?.(target)
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Could not delete this job')
    },
  })

  const reasonOk = reason.trim().length >= MIN_REASON_LENGTH
  const confirmOk = Boolean(job) && confirmationMatches(confirmation, expectedPhrase)

  return (
    <BaseModal
      open={job !== null}
      onOpenChange={(next) => {
        if (!next) close()
      }}
      title='Delete job'
      description={
        job
          ? `This removes "${job.name}" from the ${appEnv} job store. If it is recurring, its schedule stops; if it is queued, it never runs.`
          : undefined
      }
      primaryText='Delete'
      primaryVariant='destructive'
      secondaryText='Cancel'
      onPrimaryAction={() => mutation.mutate()}
      isLoading={mutation.isPending}
      primaryDisabled={!reasonOk || !confirmOk || !canMutate}>
      <Stack spacing={4}>
        {!canMutate && <ProdNotice />}
        <ReasonField
          id='delete-job-reason'
          value={reason}
          onChange={setReason}
          placeholder='Why is this job being deleted? Recorded in the audit log.'
        />
        <div className='space-y-2'>
          <Label htmlFor='delete-job-confirm'>
            Type <span className='font-mono font-semibold'>{expectedPhrase}</span> to confirm
          </Label>
          <Input
            id='delete-job-confirm'
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={expectedPhrase}
            className='font-mono text-sm'
            autoComplete='off'
          />
        </div>
      </Stack>
    </BaseModal>
  )
}
