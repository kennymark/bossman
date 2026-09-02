import { Link } from '@inertiajs/react'

import type { Column } from '#types/extra'
import type { RawMaintenanceRequest } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { isMaintenanceOverdue } from '#utils/maintenance_status'
import { MaintenanceSeverityBadge } from '@/components/maintenance/severity-badge'
import { MaintenanceStatusBadge } from '@/components/maintenance/status-badge'
import { dateFormatter } from '@/lib/date'
import { cn } from '@/lib/utils'

/** `Agreement for X` is how the product names leases; the console shows just `X`. */
export function leaseDisplayName(
  lease: { name?: string | null; shortId?: string | null } | null | undefined,
) {
  if (!lease) return null
  return lease.name?.replace('Agreement for ', '') || lease.shortId || null
}

export function MaintenanceDueDate({ row }: { row: RawMaintenanceRequest }) {
  if (!row.dueDate) return <span className='text-muted-foreground'>—</span>
  const overdue = isMaintenanceOverdue(row.dueDate, row.status)
  return (
    <span
      className={cn(overdue && 'font-medium text-destructive')}
      title={overdue ? 'Overdue' : undefined}>
      {dateFormatter(row.dueDate)}
      {overdue && <span className='ml-1 text-xs'>(overdue)</span>}
    </span>
  )
}

/**
 * Columns shared by the maintenance index and the org tab. The index adds the org
 * column; the org tab already knows which org it is on.
 */
export function buildMaintenanceColumns(
  options: { showOrg?: boolean } = {},
): Column<RawMaintenanceRequest>[] {
  const columns: Column<RawMaintenanceRequest>[] = [
    {
      key: 'title',
      header: 'Request',
      minWidth: 220,
      flex: 1,
      cell: (row) => (
        <div className='space-y-0.5'>
          <Link href={`/maintenance/${row.id}`} className='font-medium hover:underline'>
            {row.title || 'Untitled request'}
          </Link>
          {row.tenant?.name && (
            <div className='text-xs text-muted-foreground'>Reported for {row.tenant.name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      width: 120,
      cell: (row) => <MaintenanceSeverityBadge severity={row.severity} />,
    },
    {
      key: 'status',
      header: 'Status',
      width: 130,
      cell: (row) => <MaintenanceStatusBadge status={row.status} />,
    },
  ]

  if (options.showOrg) {
    columns.push({
      key: 'org',
      header: 'Org',
      width: 160,
      cell: (row) =>
        row.org ? (
          <Link href={`/orgs/${row.org.id}`} className='font-medium hover:underline'>
            {row.org.cleanName ?? row.org.name}
          </Link>
        ) : (
          '—'
        ),
    })
  }

  columns.push(
    {
      key: 'property',
      header: 'Property / lease',
      minWidth: 180,
      cell: (row) => (
        <div className='space-y-0.5 text-sm'>
          {row.leaseableEntityId && row.leaseableEntity ? (
            <Link href={`/properties/${row.leaseableEntityId}`} className='hover:underline'>
              {row.leaseableEntity.address || 'Property'}
            </Link>
          ) : (
            <span className='text-muted-foreground'>No property</span>
          )}
          {row.leaseId && row.lease && (
            <div className='text-xs text-muted-foreground'>
              <Link href={`/leases/${row.leaseId}`} className='hover:underline'>
                {leaseDisplayName(row.lease)}
              </Link>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      width: 150,
      cell: (row) => <MaintenanceDueDate row={row} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      width: 130,
      cell: (row) => timeAgo(row.createdAt),
    },
  )

  return columns
}

export const maintenanceTableColumns = buildMaintenanceColumns()
