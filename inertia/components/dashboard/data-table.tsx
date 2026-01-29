import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDisclosure } from '@/hooks/use-disclosure'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select' | 'date' | 'dateRange'
  filterOptions?: { value: string; label: string }[]
}

interface FilterPreset {
  name: string
  filters: Record<string, unknown>
}

interface DataTableProps<T extends { id?: string }> {
  columns: Column<T>[]
  data: T[]
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchDebounceMs?: number
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
  }
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  // Bulk selection props
  selectable?: boolean
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  getRowId?: (row: T) => string
  // Advanced filtering props
  filterable?: boolean
  filterPresets?: FilterPreset[]
  onFiltersChange?: (filters: Record<string, unknown>) => void
  initialFilters?: Record<string, unknown>
  // Bulk actions
  bulkActions?: {
    label: string
    action: (ids: string[]) => void | Promise<void>
    variant?: 'default' | 'destructive' | 'outline'
  }[]
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  searchable,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  searchDebounceMs = 100,
  pagination,
  onRowClick,
  loading,
  emptyMessage = 'No data available',
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  getRowId = (row) => (row as { id: string }).id || '',
  filterable = false,
  filterPresets = [],
  onFiltersChange,
  initialFilters,
  bulkActions = [],
}: DataTableProps<T>) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchValue ?? '')
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const filtersDisclosure = useDisclosure()
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters ?? {})
  const [activePreset, setActivePreset] = useState<string | null>(null)

  useEffect(() => {
    if (searchValue !== undefined) {
      setLocalSearchQuery(searchValue)
    }
  }, [searchValue])

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters)
    }
  }, [initialFilters])

  // Get filterable columns
  const filterableColumns = useMemo(() => columns.filter((col) => col.filterable), [columns])

  // Apply filters (client-side only when not in server mode)
  const filteredData = useMemo(() => {
    const serverMode = Boolean(onSearchChange) || Boolean(onFiltersChange)
    if (serverMode) return data

    let result = [...data]

    // Apply search
    const effectiveSearch = localSearchQuery.trim()
    if (searchable && effectiveSearch) {
      result = result.filter((row) =>
        columns.some((col) => {
          const value = (row as Record<string, unknown>)[col.key]
          if (typeof value === 'string') {
            return value.toLowerCase().includes(effectiveSearch.toLowerCase())
          }
          return false
        }),
      )
    }

    // Apply column filters
    if (filterable) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === null || value === undefined || value === '') continue

        const column = columns.find((col) => col.key === key)
        if (!column) continue

        result = result.filter((row) => {
          const rowValue = (row as Record<string, unknown>)[key]
          if (column.filterType === 'dateRange' && typeof value === 'object') {
            const range = value as { from?: string; to?: string }
            if (rowValue && typeof rowValue === 'string') {
              const date = new Date(rowValue)
              if (range.from && date < new Date(range.from)) return false
              if (range.to && date > new Date(range.to)) return false
            }
            return true
          }
          if (typeof value === 'string') {
            return String(rowValue).toLowerCase().includes(value.toLowerCase())
          }
          return String(rowValue) === String(value)
        })
      }
    }

    return result
  }, [
    data,
    localSearchQuery,
    filters,
    columns,
    searchable,
    filterable,
    onSearchChange,
    onFiltersChange,
    searchValue,
  ])

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value)
    if (!onSearchChange) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      onSearchChange(value)
    }, searchDebounceMs)
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      const allIds = filteredData.map(getRowId).filter(Boolean)
      onSelectionChange(allIds)
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectRow = (rowId: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedRows, rowId])
    } else {
      onSelectionChange(selectedRows.filter((id) => id !== rowId))
    }
  }

  const isAllSelected =
    filteredData.length > 0 && filteredData.every((row) => selectedRows.includes(getRowId(row)))

  const handlePresetSelect = (preset: FilterPreset) => {
    setFilters(preset.filters)
    setActivePreset(preset.name)
    onFiltersChange?.(preset.filters)
  }

  const handleFilterChange = (key: string, value: unknown) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setActivePreset(null)
    onFiltersChange?.(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    setActivePreset(null)
    onFiltersChange?.({})
  }

  // Pagination
  const effectiveTotal = pagination?.total ?? filteredData.length
  const totalPages = pagination ? Math.ceil(effectiveTotal / pagination.pageSize) : 1

  const getPageNumbers = () => {
    if (!pagination) return []
    const current = pagination.page
    const total = totalPages
    const pages: (number | string)[] = []

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (current <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      } else if (current >= total - 2) {
        pages.push('...')
        for (let i = total - 3; i <= total; i++) {
          pages.push(i)
        }
      } else {
        pages.push('...')
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(total)
      }
    }
    return pages
  }

  const pageNumbers = getPageNumbers()
  const pageSizeOptions = [10, 20, 50, 100]

  return (
    <div className='space-y-4'>
      {/* Search and Filter Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center gap-2'>
          {searchable && (
            <div className='relative flex-1 max-w-sm'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder={searchPlaceholder}
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className='pl-10'
              />
            </div>
          )}
          {filterable && (
            <Popover open={filtersDisclosure.isOpen} onOpenChange={filtersDisclosure.onOpenChange}>
              <PopoverTrigger asChild>
                <Button variant='outline' size='sm' leftIcon={<Filter className='h-4 w-4' />}>
                  Filters
                  {Object.keys(filters).length > 0 && (
                    <span className='ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground'>
                      {Object.keys(filters).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-80' align='start'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-medium'>Filters</h4>
                    {Object.keys(filters).length > 0 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={clearFilters}
                        className='h-8 text-xs'>
                        Clear all
                      </Button>
                    )}
                  </div>

                  {filterPresets.length > 0 && (
                    <div className='space-y-2'>
                      <Label className='text-xs text-muted-foreground'>Presets</Label>
                      <div className='flex flex-wrap gap-2'>
                        {filterPresets.map((preset) => (
                          <Button
                            key={preset.name}
                            variant={activePreset === preset.name ? 'default' : 'outline'}
                            size='sm'
                            className='h-7 text-xs'
                            onClick={() => handlePresetSelect(preset)}>
                            {preset.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='space-y-3'>
                    {filterableColumns.map((column) => (
                      <div key={column.key} className='space-y-2'>
                        <Label className='text-xs'>{column.header}</Label>
                        {column.filterType === 'select' && column.filterOptions ? (
                          <Select
                            value={String(filters[column.key] || '__all__')}
                            onValueChange={(value) =>
                              handleFilterChange(column.key, value === '__all__' ? null : value)
                            }>
                            <SelectTrigger className='h-8'>
                              <SelectValue placeholder={`All ${column.header}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='__all__'>All {column.header}</SelectItem>
                              {column.filterOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : column.filterType === 'dateRange' ? (
                          <div className='grid grid-cols-2 gap-2'>
                            <DatePicker
                              value={(filters[column.key] as { from?: string })?.from || ''}
                              onChange={(v) =>
                                handleFilterChange(column.key, {
                                  ...((filters[column.key] as { from?: string; to?: string }) ||
                                    {}),
                                  from: v || undefined,
                                })
                              }
                              clearable
                              buttonSize='sm'
                              buttonClassName='h-8'
                            />
                            <DatePicker
                              value={(filters[column.key] as { to?: string })?.to || ''}
                              onChange={(v) =>
                                handleFilterChange(column.key, {
                                  ...((filters[column.key] as { from?: string; to?: string }) ||
                                    {}),
                                  to: v || undefined,
                                })
                              }
                              clearable
                              buttonSize='sm'
                              buttonClassName='h-8'
                            />
                          </div>
                        ) : (
                          <Input
                            type='text'
                            placeholder={`Filter ${column.header}...`}
                            value={String(filters[column.key] || '')}
                            onChange={(e) => handleFilterChange(column.key, e.target.value || null)}
                            className='h-8'
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Bulk Actions */}
        {selectable && selectedRows.length > 0 && (
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>{selectedRows.length} selected</span>
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant || 'outline'}
                size='sm'
                onClick={() => action.action(selectedRows)}>
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className='hidden md:block rounded-md border border-border'>
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className='w-12'>
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label='Select all'
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.key}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className='h-24 text-center'>
                  <div className='flex items-center justify-center'>
                    <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className='h-24 text-center'>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => {
                const rowId = getRowId(row)
                const isSelected = selectedRows.includes(rowId)
                const rowKey = rowId || `row-${Math.random()}`
                return (
                  <TableRow
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-muted/50',
                    )}>
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                          aria-label={`Select ${rowId}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.cell
                          ? column.cell(row)
                          : String((row as Record<string, unknown>)[column.key] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-3'>
        {loading ? (
          <div className='flex items-center justify-center h-24 rounded-md border border-border'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          </div>
        ) : filteredData.length === 0 ? (
          <div className='text-center h-24 flex items-center justify-center rounded-md border border-border'>
            {emptyMessage}
          </div>
        ) : (
          filteredData.map((row) => {
            const rowId = getRowId(row)
            const isSelected = selectedRows.includes(rowId)
            const isClickable = Boolean(onRowClick)
            const rowKey = rowId || `row-${Math.random()}`
            const actionsColumn = columns.find((col) => col.key === 'actions')
            const dataColumns = columns.filter((col) => col.key !== 'actions')
            
            const Content = (
              <>
                {selectable && (
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${rowId}`}
                    />
                    <span className='text-xs text-muted-foreground'>Select</span>
                  </div>
                )}
                {dataColumns.map((column) => (
                  <div key={column.key} className='flex flex-col gap-1'>
                    <div className='text-xs font-medium text-muted-foreground'>
                      {column.header}
                    </div>
                    <div className='text-sm'>
                      {column.cell
                        ? column.cell(row)
                        : String((row as Record<string, unknown>)[column.key] ?? '')}
                    </div>
                  </div>
                ))}
              </>
            )

            if (isClickable) {
              return (
                <div
                  key={rowKey}
                  className={cn(
                    'rounded-md border border-border overflow-hidden',
                    isSelected && 'bg-muted/50',
                  )}>
                  <button
                    type='button'
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                        e.preventDefault()
                        onRowClick(row)
                      }
                    }}
                    tabIndex={0}
                    className={cn(
                      'w-full p-4 space-y-2 text-left',
                      'cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                    )}>
                    {Content}
                  </button>
                  {actionsColumn && (
                    <div className='px-4 pb-4 border-t bg-muted/20'>
                      {actionsColumn.cell?.(row)}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div key={rowKey} className='rounded-md border border-border p-4 space-y-2'>
                {Content}
                {actionsColumn && (
                  <div className='pt-2 border-t'>
                    {actionsColumn.cell?.(row)}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Rows per page:</span>
            {pagination.onPageSizeChange ? (
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => {
                  pagination.onPageSizeChange?.(Number(value))
                }}>
                <SelectTrigger className='w-[70px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className='text-sm font-medium'>{pagination.pageSize}</span>
            )}
          </div>

          {totalPages > 1 && (
            <div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => pagination.onPageChange(1)}
                  disabled={pagination.page <= 1}>
                  <ChevronsLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}>
                  <ChevronLeft className='h-4 w-4' />
                </Button>

                <div className='flex items-center gap-1'>
                  {pageNumbers.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${pagination.page}-${idx}`} className='px-2 text-muted-foreground'>
                          ...
                        </span>
                      )
                    }
                    const pageNum = page as number
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size='sm'
                        className='min-w-[40px]'
                        onClick={() => pagination.onPageChange(pageNum)}>
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= totalPages}>
                  <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => pagination.onPageChange(totalPages)}
                  disabled={pagination.page >= totalPages}>
                  <ChevronsRight className='h-4 w-4' />
                </Button>
              </div>
              <p className='pt-2 text-right text-sm text-muted-foreground'>
                Showing {((pagination.page - 1) * pagination.pageSize + 1).toLocaleString()} to{' '}
                {Math.min(pagination.page * pagination.pageSize, effectiveTotal).toLocaleString()} of{' '}
                {effectiveTotal.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
