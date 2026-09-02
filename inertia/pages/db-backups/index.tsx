import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, router, usePage } from '@inertiajs/react'
import { IconDownload, IconPlus, IconRotate2, IconTrash } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Column, PaginatedResponse } from '#types/extra'
import type { RawDbBackup } from '#types/model-types'
import { CONFIRMATION_PHRASES, MIN_REASON_LENGTH, confirmationMatches } from '#utils/confirmation'
import { timeAgo } from '#utils/date'
import { formatFileSize } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingOverlay } from '@/components/ui/loading'
import { Stack } from '@/components/ui/stack'
import { Textarea } from '@/components/ui/textarea'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { getFilenameFromContentDisposition } from '@/lib/download'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'
import { tablePagination } from '@/lib/pagination'

import { BackupHealth, type BackupHealthEnvironment } from './components/backup-health'
import { RestoreDialog } from './components/restore-dialog'

interface DbBackupsIndexProps extends SharedProps {
  backups: PaginatedResponse<RawDbBackup>
  health: { environments: BackupHealthEnvironment[]; unavailable?: boolean }
}

const baseColumns: Column<RawDbBackup>[] = [
  {
    key: 'filePath',
    header: 'File path',
    minWidth: 320,
    flex: 1,
    cell: (row) => (
      <span className='font-mono text-sm break-all' title={row.filePath ?? undefined}>
        {row.filePath}
      </span>
    ),
  },
  {
    key: 'fileSize',
    header: 'Size',
    width: 100,
    cell: (row) => formatFileSize(row.fileSize),
  },
  {
    key: 'createdAt',
    header: 'Created',
    width: 140,
    cell: (row) => timeAgo(row.createdAt ?? ''),
  },
]

export default function DbBackupsIndex({ backups, health }: DbBackupsIndexProps) {
  const page = usePage<SharedProps>()
  const canRestoreProd = Boolean(page.props.isGodAdmin)

  const { changePage, changeRows } = useInertiaParams({ page: 1, perPage: 20 })
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RawDbBackup | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const deletePhrase = CONFIRMATION_PHRASES['backup.delete']()
  /** Mirrors the server's rule, so the request is never sent only to fail validation. */
  const canDelete =
    confirmationMatches(deleteConfirm, deletePhrase) &&
    deleteReason.trim().length >= MIN_REASON_LENGTH

  const handleDownload = async (row: RawDbBackup) => {
    setDownloadingId(row.id)
    try {
      const res = await fetch(`/db-backups/${row.id}/download`, { credentials: 'include' })
      if (!res.ok) {
        toast.error('Failed to download backup')
        return
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const filename =
        getFilenameFromContentDisposition(disposition) ?? row.fileName ?? `backup-${row.id}.sql`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Downloaded')
    } catch {
      toast.error('Failed to download backup')
    } finally {
      setDownloadingId(null)
    }
  }

  const columns: Column<RawDbBackup>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: '',
      width: 120,
      cell: (row) => (
        <div className='flex items-center gap-1'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            aria-label='Download backup'
            disabled={downloadingId === row.id}
            onClick={() => handleDownload(row)}>
            <IconDownload className='h-4 w-4' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
            aria-label='Delete backup'
            onClick={() => {
              setDeleteTarget(row)
              setDeleteReason('')
              setDeleteConfirm('')
            }}>
            <IconTrash className='h-4 w-4' />
          </Button>
        </div>
      ),
    },
  ]

  const createBackupMutation = useMutation({
    mutationFn: () => api.api.dbBackups.store({}),
    onSuccess: () => {
      toast.success('Backup created')
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      /**
       * The endpoint now reports a failed backup as a failure. It used to answer
       * `{ success: true }` regardless, so this toast could not fire.
       */
      toast.error(serverErrorResponder(err) || 'Failed to create backup')
    },
  })

  const handleCreateBackup = () => {
    setCreateModalOpen(false)
    createBackupMutation.mutate()
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    router.delete(`/db-backups/${deleteTarget.id}`, {
      data: { reason: deleteReason, confirm: deleteConfirm },
      onFinish: () => setDeleteTarget(null),
    })
  }

  return (
    <DashboardPage
      title='Backups'
      description='View backup health and database backup history.'
      actions={
        <div className='flex items-center gap-2'>
          <RestoreDialog
            backups={backups?.data ?? []}
            canRestoreProd={canRestoreProd}
            onRestored={() => router.reload()}
            trigger={
              <Button type='button' variant='outline'>
                <IconRotate2 className='mr-2 h-4 w-4' />
                Restore
              </Button>
            }
          />
          <BaseModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            title='Create backup?'
            description='This will create a new database backup and upload it to storage. This may take a moment. Continue?'
            trigger={
              <Button type='button' variant='default'>
                <IconPlus className='mr-2 h-4 w-4' />
                Create
              </Button>
            }
            primaryText='Create backup'
            secondaryText='Cancel'
            onPrimaryAction={handleCreateBackup}
            isLoading={createBackupMutation.isPending}
          />
        </div>
      }>
      <LoadingOverlay
        text={downloadingId !== null ? 'Downloading...' : 'Creating backup...'}
        className='z-[100]'
        isLoading={downloadingId !== null || createBackupMutation.isPending}
      />

      <div className='space-y-6'>
        <Deferred data='health' fallback={<LoadingSkeleton type='card' />}>
          <BackupHealth
            environments={health?.environments ?? []}
            unavailable={health?.unavailable}
          />
        </Deferred>

        <Deferred data='backups' fallback={<LoadingSkeleton type='table' />}>
          <AppCard title='Backups' description={`${backups?.meta?.total ?? 0} total`}>
            <DataTable
              columns={columns}
              data={backups?.data ?? []}
              emptyMessage='No backups yet.'
              pagination={tablePagination(backups, {
                onPageChange: changePage,
                onPageSizeChange: changeRows,
              })}
            />
          </AppCard>
        </Deferred>
      </div>

      <BaseModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title='Delete backup?'
        description='This removes the backup record and the file from storage. This cannot be undone.'
        primaryText='Delete'
        primaryVariant='destructive'
        secondaryText='Cancel'
        onPrimaryAction={handleDelete}
        primaryDisabled={!canDelete}>
        <Stack spacing={4}>
          <p className='text-sm font-mono break-all'>{deleteTarget?.fileName}</p>
          <div className='space-y-2'>
            <Label htmlFor='delete-reason'>Reason</Label>
            <Textarea
              id='delete-reason'
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder='Recorded in the audit log.'
              rows={2}
            />
            {deleteReason.length > 0 && deleteReason.trim().length < MIN_REASON_LENGTH && (
              <p className='text-xs text-muted-foreground'>
                At least {MIN_REASON_LENGTH} characters.
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='delete-confirm'>
              Type <span className='font-mono font-semibold'>{deletePhrase}</span> to confirm
            </Label>
            <Input
              id='delete-confirm'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={deletePhrase}
              className='font-mono text-sm'
              autoComplete='off'
            />
          </div>
        </Stack>
      </BaseModal>
    </DashboardPage>
  )
}
