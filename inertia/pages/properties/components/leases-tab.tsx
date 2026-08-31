import type { PaginatedResponse } from '#types/extra'
import type { RawLease } from '#types/model-types'
import { DataTable } from '@/components/dashboard/data-table'
import { leasesTableColumns } from '@/components/leases'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import api from '@/lib/http'

type LeasesTabProps = {
  propertyId: string
}

export function LeasesTab({ propertyId }: LeasesTabProps) {
  const {
    data: leases,
    loading,
    pagination,
  } = usePaginatedTab<RawLease>(['property-leases', propertyId], (page, perPage) =>
    api
      .get<PaginatedResponse<RawLease>>(`/leaseable-entities/${propertyId}/leases`, {
        params: { page, perPage },
      })
      .then((r) => r.data),
  )

  return (
    <AppCard
      title='Leases'
      description={`Leases for this property (${pagination?.total ?? 0} total)`}>
      <DataTable
        columns={leasesTableColumns}
        data={leases}
        loading={loading}
        emptyMessage='No leases for this leaseable entity.'
        pagination={pagination}
      />
    </AppCard>
  )
}
