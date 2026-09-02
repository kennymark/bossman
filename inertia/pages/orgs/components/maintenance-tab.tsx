import type { PaginatedResponse } from '#types/extra'
import type { RawMaintenanceRequest } from '#types/model-types'
import { DataTable } from '@/components/dashboard/data-table'
import { maintenanceTableColumns } from '@/components/maintenance'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import api, { pageQuery } from '@/lib/http'

type MaintenanceTabProps = {
  orgId: string
}

export function MaintenanceTab({ orgId }: MaintenanceTabProps) {
  const {
    data: requests,
    loading,
    pagination,
  } = usePaginatedTab<RawMaintenanceRequest>(['org-maintenance', orgId], (page, perPage) =>
    api.maintenance
      .byOrg({ params: { orgId }, query: pageQuery(page, perPage) as never })
      .then((r) => r as unknown as PaginatedResponse<RawMaintenanceRequest>),
  )

  return (
    <AppCard title='Maintenance' description='Maintenance requests raised in this organisation'>
      <DataTable
        columns={maintenanceTableColumns}
        data={requests}
        loading={loading}
        emptyMessage='No maintenance requests yet.'
        pagination={pagination}
      />
    </AppCard>
  )
}
