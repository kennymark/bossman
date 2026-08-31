export const SORT_VALUES = [
  'updatedAt:desc',
  'updatedAt:asc',
  'name:asc',
  'name:desc',
  'createdAt:desc',
  'createdAt:asc',
] as const

export type SortValue = (typeof SORT_VALUES)[number]

export const SORT_LABELS: Record<SortValue, string> = {
  'updatedAt:desc': 'Updated (newest first)',
  'updatedAt:asc': 'Updated (oldest first)',
  'name:asc': 'Name A–Z',
  'name:desc': 'Name Z–A',
  'createdAt:desc': 'Created (newest first)',
  'createdAt:asc': 'Created (oldest first)',
}

export const SORT_OPTIONS = SORT_VALUES.map((value) => ({
  value,
  label: SORT_LABELS[value],
}))

export interface SortableProject {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export function sortProjects<T extends SortableProject>(projects: T[], sort: SortValue): T[] {
  const [field, order] = sort.split(':') as [keyof T, 'asc' | 'desc']
  return [...projects].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return order === 'asc' ? -1 : 1
    if (bVal == null) return order === 'asc' ? 1 : -1
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
    return order === 'asc' ? cmp : -cmp
  })
}
