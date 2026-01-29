import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link, router } from '@inertiajs/react'
import { Edit, Plus, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Column, PaginatedResponse } from '#types/extra'
import type { RawBlogPost } from '#types/model-types'
import { DataTable } from '@/components/dashboard/data-table'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useInertiaParams } from '@/hooks/use-inertia-params'

interface BlogAdminIndexProps extends SharedProps {
  posts: PaginatedResponse<RawBlogPost>
}

function isPublished(post: RawBlogPost) {
  return Boolean(post.publishedAt)
}

export default function BlogAdminIndex({ posts }: BlogAdminIndexProps) {
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const { changePage, changeRows, searchTable, query } = useInertiaParams({
    page: 1,
    perPage: 10,
    search: '',
  })

  const columns: Column<RawBlogPost>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      cell: (row) => (
        <div className='space-y-1'>
          <div className='font-medium'>{row.title}</div>
          <div className='text-xs text-muted-foreground'>/{row.slug}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={isPublished(row) ? 'default' : 'secondary'}>
          {isPublished(row) ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row) => row.category?.name || '—',
    },
    {
      key: 'publishedAt',
      header: 'Published',
      cell: (row) => (row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className='flex items-center justify-end gap-2'>
          <Button variant='ghost' size='icon' asChild>
            <Link href={`/blog/manage/${row.id}/edit`}>
              <Edit className='h-4 w-4' />
            </Link>
          </Button>
          {row.publishedAt ? (
            <Button variant='ghost' size='icon' asChild>
              <Link href={`/blog/${row.slug}`}>View</Link>
            </Button>
          ) : null}
          <Button
            variant='ghost'
            size='icon'
            className='text-destructive hover:text-destructive'
            isLoading={isDeletingId === row.id}
            onClick={() => {
              if (!confirm('Delete this post?')) return
              setIsDeletingId(row.id)
              router.delete(`/blog/manage/${row.id}`, {
                preserveScroll: true,
                onFinish: () => setIsDeletingId(null),
              })
            }}>
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <Head title='Blog admin' />
      <div className='space-y-6'>
        <PageHeader
          title='Blog'
          description='Create and manage posts, tags, and categories.'
          actions={
            <>
              <Button variant='outline' asChild>
                <Link href='/blog'>View public blog</Link>
              </Button>
              <Button variant='outline' leftIcon={<Tags />} asChild>
                <Link href='/blog/manage/categories'>Categories</Link>
              </Button>
              <Button variant='outline' leftIcon={<Tags />} asChild>
                <Link href='/blog/manage/tags'>Tags</Link>
              </Button>
              <Button variant='outline' leftIcon={<Tags />} asChild>
                <Link href='/blog/manage/authors'>Authors</Link>
              </Button>
              <Button leftIcon={<Plus />} asChild>
                <Link href='/blog/manage/create'>New post</Link>
              </Button>
            </>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Posts</CardTitle>
            <CardDescription>Search, paginate, and manage your posts.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={posts.data}
              searchable
              searchPlaceholder='Search posts...'
              searchValue={String(query.search || '')}
              onSearchChange={(value) => searchTable(String(value || ''))}
              pagination={{
                page: posts.meta.currentPage,
                pageSize: posts.meta.perPage,
                total: posts.meta.total,
                onPageChange: changePage,
                onPageSizeChange: changeRows,
              }}
              emptyMessage='No posts found'
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

