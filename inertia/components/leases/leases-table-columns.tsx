import { Link } from '@inertiajs/react'

import type { Column } from '#types/extra'
import type { RawLease } from '#types/model-types'
import { formatCurrency } from '#utils/currency'
import { leaseEndLabel } from '#utils/lease_period'
import { LeaseStatusBadge } from '@/components/leases/status-badge'
import { dateFormatter } from '@/lib/date'

/** Shared table columns for lease lists (e.g. org LeasesTab, property LeasesTab) */
export const leasesTableColumns: Column<RawLease>[] = [
  {
    key: 'name',
    header: 'Lease',
    minWidth: 200,
    flex: 1,
    cell: (row) => (
      <Link href={`/leases/${row.id}`} className='font-medium hover:underline'>
        {row.cleanName ?? row.name ?? row.shortId}
      </Link>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 110,
    cell: (row) => <LeaseStatusBadge status={row.status} />,
  },
  {
    key: 'rentAmount',
    header: 'Rent',
    width: 100,
    cell: (row) => formatCurrency(row.rentAmount, row.currency) ?? '—',
  },
  {
    key: 'startDate',
    header: 'Start',
    width: 110,
    cell: (row) => (row.startDate ? dateFormatter(row.startDate) : '—'),
  },
  {
    key: 'endDate',
    header: 'End',
    width: 110,
    cell: (row) => leaseEndLabel(row, dateFormatter),
  },
]
