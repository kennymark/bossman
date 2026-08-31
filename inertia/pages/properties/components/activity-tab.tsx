import type { PaginatedResponse } from '#types/extra'
import type { RawActivity } from '#types/model-types'
import { activityTabColumns } from '@/components/dashboard/activity-columns'
import { DataTable } from '@/components/dashboard/data-table'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import api from '@/lib/http'

type ActivityTabProps = {
  propertyId: string
}

export function ActivityTab({ propertyId }: ActivityTabProps) {
  const {
    data: activity,
    loading,
    pagination,
  } = usePaginatedTab<RawActivity>(['property-activity', propertyId], (page, perPage) =>
    api
      .get<PaginatedResponse<RawActivity>>(`/leaseable-entities/${propertyId}/activity`, {
        params: { page, perPage },
      })
      .then((r) => r.data),
  )

  return (
    <AppCard title='Activity' description='Recent activity for this property'>
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
