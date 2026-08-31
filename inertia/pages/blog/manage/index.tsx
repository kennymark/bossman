import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, Link, router } from '@inertiajs/react'
import { IconEdit, IconPlus, IconTags, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'

import type { Column, PaginatedResponse } from '#types/extra'
import type { RawBlogPost } from '#types/model-types'
import { BlogStatusBadge } from '@/components/blog'
import { formatBlogDateTime } from '@/components/blog/blog-utils'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { tablePagination } from '@/lib/pagination'

type StatusFilter = 'all' | 'published' | 'scheduled' | 'draft'

interface BlogAdminIndexProps extends SharedProps {
  posts?: PaginatedResponse<RawBlogPost>
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' },
]

export default function BlogAdminIndex({ posts }: BlogAdminIndexProps) {
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const { changePage, changeRows, searchTable, query, updateQuery } = useInertiaParams({
    page: 1,
    perPage: 10,
    search: '',
    status: 'all',
  })

  const currentStatus = (query.status as StatusFilter) || 'all'

  const columns: Column<RawBlogPost>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      width: 250,
      cell: (row) => (
        <div className='space-y-1'>
          <Link href={`/blog/manage/${row.id}/edit`}>
            <div className='block items-center gap-2'>
              <div className='font-medium'>{row.title}</div>
              <BlogStatusBadge post={row} className='shrink-0 mt-1' />
            </div>
          </Link>
        </div>
      ),
    },
    {
      key: 'publishedAt',
      header: 'Published / Scheduled',
      width: 200,
      cell: (row) =>
        row.publishedAt
          ? formatBlogDateTime(row.publishedAt)
          : row.scheduledAt
            ? formatBlogDateTime(row.scheduledAt)
            : '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      // minWidth: 200,
      width: 100,
      cell: (row) => (
        <div className='flex items-center justify-end gap-2'>
          <Button variant='ghost' size='icon' asChild leftIcon={<IconEdit className='h-4 w-4' />}>
            <Link href={`/blog/manage/${row.id}/edit`}>Edit</Link>
          </Button>
          {row.publishedAt ? (
            <Button variant='ghost' size='icon' asChild>
              <Link href={`/blog/${row.slug}`}>View</Link>
            </Button>
          ) : null}
          <Button
            variant='ghost'
            size='icon'
            leftIcon={<IconTrash className='h-4 w-4' />}
            className='text-destructive hover:text-destructive'
            isLoading={isDeletingId === row.id}
            onClick={() => {
              if (!confirm('Delete this post?')) return
              setIsDeletingId(row.id)
              router.delete(`/blog/manage/${row.id}`, {
                preserveScroll: true,
                onFinish: () => setIsDeletingId(null),
              })
            }}></Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardPage
      title='Blog admin'
      description='Create and manage posts and categories.'
      actions={
        <>
          <Button variant='outline' asChild>
            <Link href='/blog'>View public blog</Link>
          </Button>
          <Button variant='outline' leftIcon={<IconTags />} asChild>
            <Link href='/blog/manage/categories'>Categories</Link>
          </Button>
          <Button leftIcon={<IconPlus />} asChild>
            <Link href='/blog/manage/create'>New post</Link>
          </Button>
        </>
      }>
      <Deferred data='posts' fallback={<LoadingSkeleton type='table' />}>
        <AppCard title='Posts' description='Search, paginate, and manage your posts.'>
          <DataTable
            columns={columns}
            data={posts?.data ?? []}
            searchable
            searchPlaceholder='Search posts...'
            searchValue={String(query.search || '')}
            onSearchChange={(value) => searchTable(String(value || ''))}
            toolbarStart={
              <div className='flex items-center gap-2 shrink-0'>
                <div className='flex rounded-lg border border-border p-0.5 bg-muted/30'>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type='button'
                      onClick={() => updateQuery({ status: opt.value, page: 1 })}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        currentStatus === opt.value
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            }
            pagination={tablePagination(posts, {
              onPageChange: changePage,
              onPageSizeChange: changeRows,
            })}
            emptyMessage='No posts found'
          />
        </AppCard>
      </Deferred>
    </DashboardPage>
  )
}
