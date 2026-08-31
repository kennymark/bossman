import type { PaginatedResponse } from '#types/extra'
import type { RawActivity } from '#types/model-types'
import { activityTabColumns } from '@/components/dashboard/activity-columns'
import { DataTable } from '@/components/dashboard/data-table'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import api from '@/lib/http'

interface ActivityTabProps {
  leaseId: string
}

export function ActivityTab({ leaseId }: ActivityTabProps) {
  const {
    data: activity,
    loading,
    pagination,
  } = usePaginatedTab<RawActivity>(['lease-activity', leaseId], (page, perPage) =>
    api
      .get<PaginatedResponse<RawActivity>>(`/leases/${leaseId}/activity`, {
        params: { page, perPage },
      })
      .then((r) => r.data),
  )

  return (
    <AppCard title='Activity' description='Recent activity for this lease'>
      <DataTable
        columns={activityTabColumns}
        data={activity}
        loading={loading}
        emptyMessage='No activity yet.'
        pagination={pagination}
      />
    </AppCard>
  )
}
