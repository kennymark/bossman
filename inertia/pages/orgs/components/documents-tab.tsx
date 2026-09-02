import type { PaginatedResponse } from '#types/extra'
import type { RawDocument } from '#types/model-types'
import { DataTable } from '@/components/dashboard/data-table'
import { documentsTableColumns } from '@/components/documents'
import { AppCard } from '@/components/ui/app-card'
import { usePaginatedTab } from '@/hooks/use-paginated-tab'
import api, { pageQuery } from '@/lib/http'

type DocumentsTabProps = {
  orgId: string
}

export function DocumentsTab({ orgId }: DocumentsTabProps) {
  const {
    data: documents,
    loading,
    pagination,
  } = usePaginatedTab<RawDocument>(['org-documents', orgId], (page, perPage) =>
    api.documents
      .byOrg({ params: { orgId }, query: pageQuery(page, perPage) as never })
      .then((r) => r as unknown as PaginatedResponse<RawDocument>),
  )

  return (
    <AppCard title='Documents' description='Documents uploaded in this organisation'>
      <DataTable
        columns={documentsTableColumns}
        data={documents}
        loading={loading}
        emptyMessage='No documents yet.'
        pagination={pagination}
      />
    </AppCard>
  )
}
