import { Link } from '@inertiajs/react'

import type { Column } from '#types/extra'
import type { RawDocument } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { ComplianceBadge, DocumentTypeBadge } from '@/components/documents/doc-type-badge'
import { DocumentExpiryBadge } from '@/components/documents/expiry-badge'
import { leaseDisplayName } from '@/components/maintenance/maintenance-table-columns'

/**
 * Columns shared by the documents index and the org tab. There is deliberately no
 * download cell: the console never exposes a signed URL for a customer document.
 */
export function buildDocumentColumns(options: { showOrg?: boolean } = {}): Column<RawDocument>[] {
  const columns: Column<RawDocument>[] = [
    {
      key: 'name',
      header: 'Document',
      minWidth: 220,
      flex: 1,
      cell: (row) => (
        <div className='space-y-0.5'>
          <div className='font-medium'>{row.name || row.fileName || 'Untitled'}</div>
          {row.fileName && row.fileName !== row.name && (
            <div className='truncate text-xs text-muted-foreground' title={row.fileName}>
              {row.fileName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'docType',
      header: 'Type',
      width: 150,
      cell: (row) => <DocumentTypeBadge docType={row.docType} />,
    },
    {
      key: 'compliance',
      header: 'Compliance',
      width: 130,
      cell: (row) => <ComplianceBadge isCompliance={row.isComplianceDocument} />,
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      width: 190,
      cell: (row) => <DocumentExpiryBadge expiresAt={row.expiresAt} />,
    },
  ]

  if (options.showOrg) {
    columns.push({
      key: 'org',
      header: 'Org',
      width: 160,
      cell: (row) =>
        row.org ? (
          <Link href={`/orgs/${row.org.id}`} className='font-medium hover:underline'>
            {row.org.cleanName ?? row.org.name}
          </Link>
        ) : (
          '—'
        ),
    })
  }

  columns.push(
    {
      key: 'linked',
      header: 'Lease / property',
      minWidth: 180,
      cell: (row) => (
        <div className='space-y-0.5 text-sm'>
          {row.leaseId && row.lease ? (
            <Link href={`/leases/${row.leaseId}`} className='hover:underline'>
              {leaseDisplayName(row.lease)}
            </Link>
          ) : row.leaseableEntityId && row.leaseableEntity ? (
            <Link href={`/properties/${row.leaseableEntityId}`} className='hover:underline'>
              {row.leaseableEntity.address || 'Property'}
            </Link>
          ) : (
            <span className='text-muted-foreground'>—</span>
          )}
          {row.leaseId && row.leaseableEntityId && row.leaseableEntity && (
            <div className='text-xs text-muted-foreground'>
              <Link href={`/properties/${row.leaseableEntityId}`} className='hover:underline'>
                {row.leaseableEntity.address || 'Property'}
              </Link>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Uploaded',
      width: 130,
      cell: (row) => timeAgo(row.createdAt),
    },
  )

  return columns
}

export const documentsTableColumns = buildDocumentColumns()
