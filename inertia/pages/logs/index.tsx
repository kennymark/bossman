import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred } from '@inertiajs/react'
import { useState } from 'react'

import type { Column, PaginatedResponse } from '#types/extra'
import { timeAgo } from '#utils/date'
import { startCase } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { BaseSheet } from '@/components/ui/base-sheet'
import { Button } from '@/components/ui/button'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { dateFormatter } from '@/lib/date'
import { tablePagination } from '@/lib/pagination'

import { LogsFilters } from './components/logs-filters'

/** Audit row from @stouder-io/adonis-auditing (camelCase or snake_case from serialization). */
export type RawAudit = {
  id: number
  event: string
  auditableType?: string
  auditable_type?: string
  auditableId?: string | number
  auditable_id?: string | number
  userId?: string | null
  user_id?: string | null
  userType?: string | null
  user_type?: string | null
  oldValues?: Record<string, unknown> | null
  old_values?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  createdAt?: string
  created_at?: string
  updatedAt?: string | null
  updated_at?: string | null
}

interface LogsIndexProps extends SharedProps {
  audits: PaginatedResponse<RawAudit>
  filters: { event: string; auditableType: string }
}

function buildColumns(onView: (row: RawAudit) => void): Column<RawAudit>[] {
  return [
    {
      key: 'auditableType',
      header: 'Model',
      width: 160,
      cell: (row) => {
        const type = row.auditableType ?? row.auditable_type
        return <span className='font-mono text-sm'>{type ? startCase(type) : '—'}</span>
      },
    },
    {
      key: 'event',
      header: 'Event',
      width: 100,
      cell: (row) => <span className='capitalize font-medium'>{startCase(row.event)}</span>,
    },
    {
      key: 'auditableId',
      header: 'Record ID',
      width: 140,
      cell: (row) => {
        const id = row.auditableId ?? row.auditable_id
        return (
          <span className='font-mono text-xs text-muted-foreground truncate block max-w-[120px]'>
            {id != null ? String(id) : '—'}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'When',
      width: 160,
      cell: (row) => {
        const at = row.createdAt ?? row.created_at
        return at ? <span title={dateFormatter(at)}>{timeAgo(at)}</span> : '—'
      },
    },
    {
      key: 'actions',
      header: '',
      width: 80,
      cell: (row) => (
        <Button variant='ghost' size='sm' onClick={() => onView(row)}>
          View
        </Button>
      ),
    },
  ]
}

function AuditDetailContent({ audit }: { audit: RawAudit }) {
  const oldV = audit.oldValues ?? audit.old_values ?? null
  const newV = audit.newValues ?? audit.new_values ?? null
  const meta = audit.metadata ?? null
  const json = (obj: Record<string, unknown> | null) =>
    obj == null ? '—' : JSON.stringify(obj, null, 2)

  return (
    <div className='space-y-4 text-sm'>
      <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1'>
        <dt className='text-muted-foreground'>ID</dt>
        <dd className='font-mono'>{audit.id}</dd>
        <dt className='text-muted-foreground'>Event</dt>
        <dd className='capitalize font-medium'>{audit.event}</dd>
        <dt className='text-muted-foreground'>Model</dt>
        <dd className='font-mono'>{audit.auditableType ?? audit.auditable_type ?? '—'}</dd>
        <dt className='text-muted-foreground'>Record ID</dt>
        <dd className='font-mono text-muted-foreground'>
          {String(audit.auditableId ?? audit.auditable_id ?? '—')}
        </dd>
        <dt className='text-muted-foreground'>User ID</dt>
        <dd className='font-mono text-muted-foreground'>{audit.userId ?? audit.user_id ?? '—'}</dd>
        <dt className='text-muted-foreground'>When</dt>
        <dd>
          {(audit.createdAt ?? audit.created_at)
            ? dateFormatter(audit.createdAt ?? audit.created_at!)
            : '—'}
        </dd>
      </dl>
      {oldV != null && Object.keys(oldV).length > 0 && (
        <div>
          <p className='font-medium text-muted-foreground mb-1'>Old values</p>
          <pre className='rounded-md bg-muted p-3 text-xs overflow-auto max-h-40'>{json(oldV)}</pre>
        </div>
      )}
      {newV != null && Object.keys(newV).length > 0 && (
        <div>
          <p className='font-medium text-muted-foreground mb-1'>New values</p>
          <pre className='rounded-md bg-muted p-3 text-xs overflow-auto max-h-40'>{json(newV)}</pre>
        </div>
      )}
      {meta != null && Object.keys(meta).length > 0 && (
        <div>
          <p className='font-medium text-muted-foreground mb-1'>Metadata</p>
          <pre className='rounded-md bg-muted p-3 text-xs overflow-auto max-h-40'>{json(meta)}</pre>
        </div>
      )}
    </div>
  )
}

export default function LogsIndex({ audits, filters }: LogsIndexProps) {
  const { changePage, changeRows, updateQuery } = useInertiaParams({
    page: 1,
    perPage: 20,
    event: filters.event,
    auditableType: filters.auditableType,
  })
  const [selectedAudit, setSelectedAudit] = useState<RawAudit | null>(null)
  const viewSheetOpen = selectedAudit != null

  const openView = (row: RawAudit) => setSelectedAudit(row)
  const closeView = () => setSelectedAudit(null)

  return (
    <DashboardPage
      title='Logs'
      description='Audit events across the app (create, update, delete on auditable models).'>
      <BaseSheet
        open={viewSheetOpen}
        onOpenChange={(open) => !open && closeView()}
        title='Audit details'
        description={
          selectedAudit
            ? `Event: ${selectedAudit.event} · ${selectedAudit.auditableType ?? selectedAudit.auditable_type ?? ''}`
            : undefined
        }
        side='right'
        className='w-full sm:max-w-lg'
        showFooter={false}>
        {selectedAudit != null ? <AuditDetailContent audit={selectedAudit} /> : null}
      </BaseSheet>

      <Deferred data='audits' fallback={<LoadingSkeleton type='table' />}>
        <AppCard title='Audit log' description={`${audits?.meta?.total ?? 0} events`}>
          <div className='space-y-4'>
            <LogsFilters
              event={filters.event}
              auditableType={filters.auditableType}
              onEventChange={(v) => updateQuery({ event: v })}
              onAuditableTypeChange={(v) => updateQuery({ auditableType: v })}
            />
            <DataTable
              columns={buildColumns(openView)}
              data={audits?.data ?? []}
              pagination={tablePagination(audits, {
                onPageChange: changePage,
                onPageSizeChange: (pageSize) => {
                  changeRows(pageSize)
                  changePage(1)
                },
              })}
              emptyMessage='No audit events found'
            />
          </div>
        </AppCard>
      </Deferred>
    </DashboardPage>
  )
}
