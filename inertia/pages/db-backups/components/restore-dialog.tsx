import { IconAlertTriangle } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { RESTORE_TARGETS, type RestoreTarget } from '#types/env'
import { CONFIRMATION_PHRASES, MIN_REASON_LENGTH, confirmationMatches } from '#utils/confirmation'
import { formatFileSize } from '#utils/functions'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stack } from '@/components/ui/stack'
import { Textarea } from '@/components/ui/textarea'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface BackupOption {
  id: number
  fileName?: string | null
  filePath?: string | null
  createdAt?: string | null
}

interface RestorePreview {
  fileName: string
  fileSize: number
  statementCount: number
  destructiveTables: string[]
  tablesCreated: string[]
  tablesCopied: string[]
  warnings: string[]
  target: RestoreTarget
  confirmationPhrase: string
}

export interface RestoreDialogProps {
  backups: BackupOption[]
  /** Only a god admin may restore into production; the server enforces this too. */
  canRestoreProd: boolean
  onRestored: () => void
  trigger: React.ReactNode
}

/**
 * Restore, behind a dry run and a typed confirmation.
 *
 * This dialog used to take a free-form PostgreSQL connection URL, which meant a
 * production dump could be restored into any host the operator typed. The target is now
 * a named database resolved server-side, and nothing runs until the operator has seen
 * what the dump would do.
 */
export function RestoreDialog({
  backups,
  canRestoreProd,
  onRestored,
  trigger,
}: RestoreDialogProps) {
  const [open, setOpen] = useState(false)
  const [backupId, setBackupId] = useState('')
  const [target, setTarget] = useState<RestoreTarget>('dev')
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState('')
  const [preview, setPreview] = useState<RestorePreview | null>(null)

  const availableTargets = RESTORE_TARGETS.filter((t) => t !== 'prod' || canRestoreProd)
  const expectedPhrase = CONFIRMATION_PHRASES['backup.restore'](target)

  const reset = () => {
    setBackupId('')
    setTarget('dev')
    setReason('')
    setConfirm('')
    setPreview(null)
  }

  const previewMutation = useMutation({
    mutationFn: () =>
      api.post<RestorePreview>(`/db-backups/${backupId}/restore-preview`, { target }),
    onSuccess: (response) => setPreview(response.data as RestorePreview),
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Could not read that backup')
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => api.post(`/db-backups/${backupId}/restore`, { target, reason, confirm }),
    onSuccess: () => {
      toast.success('Restore completed successfully')
      setOpen(false)
      reset()
      onRestored()
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to restore backup')
    },
  })

  const reasonOk = reason.trim().length >= MIN_REASON_LENGTH
  const confirmOk = confirmationMatches(confirm, expectedPhrase)
  const canRestore = Boolean(preview) && reasonOk && confirmOk

  return (
    <BaseModal
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
      title='Restore backup'
      description='Choose a backup and a target database. Nothing is written until you have reviewed the dry run below.'
      trigger={trigger}
      primaryText='Restore'
      primaryVariant='destructive'
      secondaryText='Cancel'
      onPrimaryAction={() => restoreMutation.mutate()}
      isLoading={restoreMutation.isPending}
      primaryDisabled={!canRestore}>
      <Stack spacing={4}>
        <div className='space-y-2'>
          <Label htmlFor='restore-backup'>Backup</Label>
          <Select
            value={backupId}
            onValueChange={(value) => {
              setBackupId(value ?? '')
              setPreview(null)
            }}
            id='restore-backup'>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a backup to restore' />
            </SelectTrigger>
            <SelectContent>
              {backups.map((backup) => (
                <SelectItem key={backup.id} value={String(backup.id)}>
                  {backup.fileName ?? backup.filePath ?? `Backup #${backup.id}`} (
                  {backup.createdAt ? new Date(backup.createdAt).toLocaleString() : '—'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='restore-target'>Target database</Label>
          <Select
            value={target}
            onValueChange={(value) => {
              setTarget((value as RestoreTarget) ?? 'dev')
              setPreview(null)
              setConfirm('')
            }}
            id='restore-target'>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a target' />
            </SelectTrigger>
            <SelectContent>
              {availableTargets.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === 'prod' ? 'Production' : 'Development'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canRestoreProd && (
            <p className='text-xs text-muted-foreground'>
              Only a god admin can restore into production.
            </p>
          )}
        </div>

        <Button
          type='button'
          variant='outline'
          className='w-full'
          disabled={!backupId}
          isLoading={previewMutation.isPending}
          loadingText='Reading dump…'
          onClick={() => previewMutation.mutate()}>
          {preview ? 'Re-run dry run' : 'Run dry run'}
        </Button>

        {preview && (
          <div className='rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2'>
            <div className='flex items-center gap-2 text-destructive'>
              <IconAlertTriangle className='h-4 w-4 shrink-0' />
              <p className='text-sm font-medium'>
                This will overwrite {target === 'prod' ? 'PRODUCTION' : 'development'}
              </p>
            </div>
            <dl className='grid grid-cols-2 gap-x-4 gap-y-1 text-xs'>
              <dt className='text-muted-foreground'>Dump size</dt>
              <dd>{formatFileSize(preview.fileSize)}</dd>
              <dt className='text-muted-foreground'>Statements</dt>
              <dd>{preview.statementCount.toLocaleString()}</dd>
              <dt className='text-muted-foreground'>Tables dropped or truncated</dt>
              <dd>{preview.destructiveTables.length}</dd>
              <dt className='text-muted-foreground'>Tables created</dt>
              <dd>{preview.tablesCreated.length}</dd>
              <dt className='text-muted-foreground'>Tables repopulated</dt>
              <dd>{preview.tablesCopied.length}</dd>
            </dl>
            {preview.destructiveTables.length > 0 && (
              <p className='text-xs font-mono text-muted-foreground break-all line-clamp-3'>
                {preview.destructiveTables.join(', ')}
              </p>
            )}
            {preview.warnings.map((warning) => (
              <p key={warning} className='text-xs text-destructive'>
                {warning}
              </p>
            ))}
          </div>
        )}

        <div className='space-y-2'>
          <Label htmlFor='restore-reason'>Reason</Label>
          <Textarea
            id='restore-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Why is this restore being run? Recorded in the audit log.'
            rows={2}
          />
          {!reasonOk && reason.length > 0 && (
            <p className='text-xs text-muted-foreground'>
              At least {MIN_REASON_LENGTH} characters.
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='restore-confirm'>
            Type <span className='font-mono font-semibold'>{expectedPhrase}</span> to confirm
          </Label>
          <Input
            id='restore-confirm'
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={expectedPhrase}
            className='font-mono text-sm'
            autoComplete='off'
          />
        </div>
      </Stack>
    </BaseModal>
  )
}
