import { Link } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { Column } from '#types/extra'
import type { TogethaCurrencies } from '#utils/currency'
import { formatCurrency } from '#utils/currency'
import { formatNumber } from '#utils/functions'
import {
  DEFAULT_PAYMENT_STATUS,
  PAYMENT_STATUS_FILTERS,
  type PaymentStatusFilter,
  statusLabel,
} from '#utils/payments'
import { DataTable } from '@/components/dashboard/data-table'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { dateFormatter } from '@/lib/date'
import api from '@/lib/http'
import { tablePaginationFromMeta } from '@/lib/pagination'

const ALL_USERS = 'all'

interface PaymentTenant {
  id: string
  name: string | null
}

interface OrgPaymentRow {
  id: string
  leaseId: string
  leaseName: string | null
  tenants: PaymentTenant[]
  amountDue: number
  amountPaid: number
  currency: string | null
  status: string
  statusAlt: string
  category: string | null
  reference: string | null
  dueDate: string | null
  paymentDate: string | null
}

interface OrgPaymentsResponse {
  data: OrgPaymentRow[]
  meta: { currentPage: number; perPage: number; total: number; lastPage: number }
  statusCounts: Record<string, number>
}

interface PaymentUser {
  id: string
  name: string | null
  email: string | null
  payments: number
}

/** Paid reads as settled; anything owed or failed is worth a warmer colour. */
function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'paid' || status === 'overpaid') return 'default'
  if (status === 'failed' || status === 'overdue') return 'destructive'
  if (status === 'unpaid' || status === 'underpaid') return 'outline'
  return 'secondary'
}

const columns: Column<OrgPaymentRow>[] = [
  {
    key: 'tenants',
    header: 'User',
    minWidth: 160,
    cell: (row) =>
      row.tenants.length > 0 ? (
        <span className='font-medium'>{row.tenants.map((t) => t.name ?? '—').join(', ')}</span>
      ) : (
        <span className='text-muted-foreground'>No tenant</span>
      ),
  },
  {
    key: 'lease',
    header: 'Lease',
    width: 160,
    cell: (row) =>
      row.leaseId ? (
        <Link href={`/leases/${row.leaseId}`} className='hover:underline'>
          {row.leaseName ?? row.leaseId}
        </Link>
      ) : (
        '—'
      ),
  },
  {
    key: 'amountDue',
    header: 'Due',
    width: 110,
    cell: (row) => formatCurrency(row.amountDue, row.currency as TogethaCurrencies),
  },
  {
    key: 'amountPaid',
    header: 'Paid',
    width: 110,
    cell: (row) => formatCurrency(row.amountPaid, row.currency as TogethaCurrencies),
  },
  {
    key: 'status',
    header: 'Status',
    width: 110,
    cell: (row) => (
      <Badge variant={statusVariant(row.status)} className='capitalize'>
        {row.status || row.statusAlt}
      </Badge>
    ),
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

type PaymentsCardProps = {
  orgId: string
}

/**
 * Rent payments for one customer, filterable by the user who owes them.
 *
 * Payments belong to a lease rather than a person, so a payment on a shared lease
 * appears under each of its tenants. The status filter opens on paid because the
 * table is otherwise dominated by unpaid rent scheduled months ahead.
 */
export function PaymentsCard({ orgId }: PaymentsCardProps) {
  const [tenantId, setTenantId] = useState<string>(ALL_USERS)
  const [status, setStatus] = useState<PaymentStatusFilter>(DEFAULT_PAYMENT_STATUS)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const { data: users } = useQuery({
    queryKey: ['org-payment-users', orgId],
    queryFn: async () =>
      (await api.orgs.paymentUsers({ params: { id: orgId } })) as unknown as {
        data: PaymentUser[]
      },
  })

  const { data, isPending } = useQuery({
    queryKey: ['org-payments', orgId, tenantId, status, page, perPage],
    queryFn: async () =>
      (await api.orgs.payments({
        params: { id: orgId },
        query: {
          page: String(page),
          perPage: String(perPage),
          status,
          ...(tenantId === ALL_USERS ? {} : { tenantId }),
        } as never,
      })) as unknown as OrgPaymentsResponse,
  })

  const userOptions = users?.data ?? []
  const rows = data?.data ?? []
  const counts = data?.statusCounts ?? {}
  const totalAcrossStatuses = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const shown = data?.meta?.total ?? 0

  const reset = () => setPage(1)

  return (
    <AppCard
      title='Rent payments'
      description='Payments across this customer’s leases, by the user who owes them'>
      <div className='space-y-4'>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          <div className='space-y-1.5'>
            <span className='text-xs font-medium text-muted-foreground'>User</span>
            <Select
              value={tenantId}
              onValueChange={(value) => {
                setTenantId(value)
                reset()
              }}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='All users' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_USERS}>All users</SelectItem>
                {userOptions.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {(user.name ?? user.email ?? user.id) + ` (${user.payments})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <span className='text-xs font-medium text-muted-foreground'>Status</span>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as PaymentStatusFilter)
                reset()
              }}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_FILTERS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {statusLabel(value)}
                    {counts[value] === undefined ? '' : ` (${formatNumber(counts[value])})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-end text-xs text-muted-foreground'>
            {totalAcrossStatuses > 0 && (
              <span>
                Showing {formatNumber(shown)} of {formatNumber(totalAcrossStatuses)} payments
              </span>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={isPending}
          emptyMessage={
            status === 'all'
              ? 'No payments for this customer.'
              : `No ${statusLabel(status).toLowerCase()} payments. Try “All statuses”.`
          }
          pagination={tablePaginationFromMeta(data?.meta, {
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPerPage(size)
              setPage(1)
            },
          })}
        />
      </div>
    </AppCard>
  )
}
