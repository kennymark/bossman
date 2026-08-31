import type { Column } from '#types/extra'
import type { RawActivity } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { Badge } from '@/components/ui/badge'
import { dateFormatter } from '@/lib/date'

export const activityColumns: Column<RawActivity>[] = [
  { key: 'summary', header: 'Summary' },
  {
    key: 'type',
    header: 'Type',
    width: 120,
    cell: (row) => (
      <Badge variant='secondary' className='capitalize'>
        {row.type ?? '—'}
      </Badge>
    ),
  },
  {
    key: 'isSystemAction',
    header: 'Source',
    width: 190,
    cell: (row) =>
      row.isSystemAction ? (
        <Badge variant='secondary'>System</Badge>
      ) : (
        <Badge variant='outline'>{row.user?.name ?? '—'}</Badge>
      ),
  },
  {
    key: 'createdAt',
    header: 'When',
    width: 140,
    cell: (row) => (row.createdAt ? timeAgo(row.createdAt) : '—'),
  },
]

/** Activity table columns for org/lease/property activity tabs (Summary, Date, Source) */
export const activityTabColumns: Column<RawActivity>[] = [
  { key: 'summary', header: 'Summary', minWidth: 200, flex: 1 },
  {
    key: 'createdAt',
    header: 'Date',
    width: 140,
    cell: (row) => (row.createdAt ? dateFormatter(row.createdAt) : '—'),
  },
  {
    key: 'isSystemAction',
    header: 'Source',
    width: 90,
    cell: (row) =>
      row.isSystemAction ? (
        <Badge variant='secondary'>System</Badge>
      ) : (
        <Badge variant='outline'>{row.user?.name ?? '—'}</Badge>
      ),
  },
]
