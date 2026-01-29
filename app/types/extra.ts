import type { MultipartFile } from '@adonisjs/core/bodyparser'
import type db from '@adonisjs/lucid/services/db'

export type Transaction = Awaited<ReturnType<typeof db.transaction>>
export type Column<T> = {
  key: string
  header: string
  sortable?: boolean
  cell?: (row: T) => React.ReactNode
}
export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    currentPage: number
    perPage: number
    total: number
    lastPage: number
  }
}

export type File = MultipartFile | undefined
export type MultipleFiles = MultipartFile[] | undefined
