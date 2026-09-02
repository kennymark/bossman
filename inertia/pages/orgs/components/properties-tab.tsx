import type { Column, PaginatedResponse } from '#types/extra'
import type { RawProperty } from '#types/model-types'
import { DataTable } from '@/components/dashboard/data-table'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import api, { pageQuery, paginated } from '@/lib/http'

const columns: Column<RawProperty>[] = [
  {
    key: 'summarizedAddress',
    header: 'Address',

    flex: 1,
    cell: (row) =>
      row.summarizedAddress ??
      [row.addressLineOne, row.city, row.postCode].filter(Boolean).join(', '),
  },
  {
    key: 'propertyType',
    header: 'Type',
    width: 200,
    cell: (row) => (row.propertyType ? String(row.propertyType) : '—'),
  },
]

type PropertiesTabProps = {
  orgId: string
}

export function PropertiesTab({ orgId }: PropertiesTabProps) {
  const {
    data: properties,
    loading,
    pagination,
  } = usePaginatedTab<RawProperty>(['org-properties', orgId], (page, perPage) =>
    api.orgs
      .properties({ params: { id: orgId }, query: pageQuery(page, perPage) })
      .then((r) => paginated(r) as unknown as PaginatedResponse<RawProperty>),
  )

  return (
    <AppCard title='Properties' description='Properties for this organisation'>
      <DataTable
        columns={columns}
        data={properties}
        loading={loading}
        emptyMessage='No properties yet.'
        pagination={pagination}
      />
    </AppCard>
  )
}
