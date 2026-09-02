import type { PaginatedResponse } from '#types/extra'
import type { RawLease } from '#types/model-types'
import { DataTable } from '@/components/dashboard/data-table'
import { leasesTableColumns } from '@/components/leases'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import api, { pageQuery, paginated } from '@/lib/http'

type LeasesTabProps = {
  orgId: string
}

export function LeasesTab({ orgId }: LeasesTabProps) {
  const {
    data: leases,
    loading,
    pagination,
  } = usePaginatedTab<RawLease>(['org-leases', orgId], (page, perPage) =>
    api.orgs
      .leases({ params: { id: orgId }, query: pageQuery(page, perPage) })
      .then((r) => paginated(r) as unknown as PaginatedResponse<RawLease>),
  )

  return (
    <AppCard title='Leases' description='Leases for this organisation'>
      <DataTable
        columns={leasesTableColumns}
        data={leases}
        loading={loading}
        emptyMessage='No leases yet.'
        pagination={pagination}
      />
    </AppCard>
  )
}
