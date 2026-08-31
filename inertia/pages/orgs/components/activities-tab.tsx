import type { PaginatedResponse } from '#types/extra'
import type { RawActivity } from '#types/model-types'
import { activityTabColumns } from '@/components/dashboard/activity-columns'
import { DataTable } from '@/components/dashboard/data-table'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import api from '@/lib/http'

type ActivitiesTabProps = {
  orgId: string
}

export function ActivitiesTab({ orgId }: ActivitiesTabProps) {
  const {
    data: activities,
    loading,
    pagination,
  } = usePaginatedTab<RawActivity>(['org-activities', orgId], (page, perPage) =>
    api
      .get<PaginatedResponse<RawActivity>>(`/orgs/${orgId}/activities`, {
        params: { page, perPage },
      })
      .then((r) => r.data),
  )

  return (
    <AppCard title='Activities' description='Recent activity for this organisation'>
      <DataTable
        columns={activityTabColumns}
        data={activities}
        loading={loading}
        emptyMessage='No activity yet.'
        pagination={pagination}
      />
    </AppCard>
  )
}
