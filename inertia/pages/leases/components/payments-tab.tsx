import type { Column, PaginatedResponse } from '#types/extra'
import type { RawPayment } from '#types/model-types'
import { formatCurrency } from '#utils/currency'
import { DataTable } from '@/components/dashboard/data-table'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import { dateFormatter } from '@/lib/date'
import api from '@/lib/http'

const columns: Column<RawPayment>[] = [
  {
    key: 'amountDue',
    header: 'Due',
    width: 100,
    cell: (row) => formatCurrency(row.amountDue, row.lease.currency),
  },
  {
    key: 'amountPaid',
    header: 'Paid',
    width: 100,
    cell: (row) => formatCurrency(row.amountPaid, row.lease.currency),
  },
  {
    key: 'status',
    header: 'Status',
    width: 100,
    cell: (row) => <span className='capitalize'>{row.statusAlt}</span>,
  },
  {
    key: 'dueDate',
    header: 'Due date',
    width: 110,
    cell: (row) => (row.dueDate ? dateFormatter(row.dueDate) : '—'),
  },
  {
    key: 'paymentDate',
    header: 'Paid date',
    width: 110,
    cell: (row) => (row.paymentDate ? dateFormatter(row.paymentDate) : '—'),
  },
]

type PaymentsTabProps = {
  leaseId: string
}

export function PaymentsTab({ leaseId }: PaymentsTabProps) {
  const {
    data: payments,
    loading,
    pagination,
  } = usePaginatedTab<RawPayment>(['lease-payments', leaseId], (page, perPage) =>
    api
      .get<PaginatedResponse<RawPayment>>(`/leases/${leaseId}/payments`, {
        params: { page, perPage },
      })
      .then((r) => r.data),
  )

  return (
    <AppCard title='Payments' description='Payment history for this lease'>
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage='No payments yet.'
        pagination={pagination}
      />
    </AppCard>
  )
}
