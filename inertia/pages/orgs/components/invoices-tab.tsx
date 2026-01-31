import { Link, useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText, Plus } from 'lucide-react'
import type { Column } from '#types/extra'
import { formatCurrency } from '#utils/currency'
import type { TogethaCurrencies } from '#utils/currency'
import { DataTable } from '@/components/dashboard/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { dateFormatter } from '@/lib/date'
import api from '@/lib/http'

export type RawOrgInvoice = {
  id: string
  number: string | null
  status: string
  amountPaid: number
  amountDue: number
  total: number
  currency: string
  createdAt: string | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
}

type InvoicesResponse = { data: RawOrgInvoice[] }

const getColumns = (orgId: string): Column<RawOrgInvoice>[] => [
  {
    key: 'number',
    header: 'Invoice',
    minWidth: 120,
    cell: (row) => (
      <span className='font-medium'>{row.number ?? row.id}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: 100,
    cell: (row) => (
      <Badge variant={row.status === 'paid' ? 'default' : 'secondary'} className='capitalize'>
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'total',
    header: 'Amount',
    width: 120,
    cell: (row) =>
      formatCurrency(row.total / 100, row.currency as TogethaCurrencies),
  },
  {
    key: 'createdAt',
    header: 'Date',
    width: 120,
    cell: (row) => (row.createdAt ? dateFormatter(row.createdAt) : '—'),
  },
  {
    key: 'actions',
    header: '',
    width: 140,
    cell: (row) => (
      <div className='flex flex-wrap gap-1'>
        {row.status === 'draft' && (
          <Button variant='ghost' size='sm' asChild>
            <Link
              href={`/orgs/${orgId}/invoices/${row.id}/line-items/create`}
              className='inline-flex items-center gap-1'
            >
              <Plus className='h-3.5 w-3.5' />
              Add line item
            </Link>
          </Button>
        )}
        {row.hostedInvoiceUrl && (
          <Button variant='ghost' size='sm' asChild>
            <a
              href={row.hostedInvoiceUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1'
            >
              <ExternalLink className='h-3.5 w-3.5' />
              View
            </a>
          </Button>
        )}
        {row.invoicePdf && (
          <Button variant='ghost' size='sm' asChild>
            <a
              href={row.invoicePdf}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1'
            >
              <FileText className='h-3.5 w-3.5' />
              PDF
            </a>
          </Button>
        )}
      </div>
    ),
  },
]

type InvoicesTabProps = {
  orgId: string
}

export function InvoicesTab({ orgId }: InvoicesTabProps) {
  const { data, isPending } = useQuery({
    queryKey: ['org-invoices', orgId],
    queryFn: async () => {
      const res = await api.get<InvoicesResponse>(`/orgs/${orgId}/invoices`)
      return res.data
    },
  })

  const invoices = data?.data ?? []
  const columns = getColumns(orgId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Invoices for this organisation</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={invoices}
          loading={isPending}
          emptyMessage='No invoices yet.'
        />
      </CardContent>
    </Card>
  )
}
