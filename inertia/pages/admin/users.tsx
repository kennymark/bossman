import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link } from '@inertiajs/react'
import { ShieldCheck, User } from 'lucide-react'
import type { PaginatedResponse } from '#types/extra'
import { DataTable } from '@/components/dashboard/data-table'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useInertiaParams } from '@/hooks/use-inertia-params'

type AdminUserRow = {
  id: string
  fullName: string | null
  email: string
  role: 'admin'
  createdAt: string | null
  lastLoginAt: string | null
}

interface AdminUsersProps extends SharedProps {
  users: PaginatedResponse<AdminUserRow>
}

export default function AdminUsers({ users }: AdminUsersProps) {
  const { changePage, changeRows, searchTable, query } = useInertiaParams({
    page: 1,
    perPage: 20,
    search: '',
  })

  return (
    <DashboardLayout>
      <Head title='Admin users' />
      <div className='space-y-6'>
        <PageHeader
          title='Users'
          description='Search and review accounts.'
          actions={
            <Button variant='outline' asChild>
              <Link href='/dashboard'>Back to dashboard</Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>All users</CardTitle>
            <CardDescription>{users.meta.total} total</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  key: 'email',
                  header: 'User',
                  cell: (row: AdminUserRow) => (
                    <div className='space-y-1'>
                      <div className='font-medium flex items-center gap-2'>
                        <User className='h-4 w-4 text-muted-foreground' />
                        <Link href={`/users/${row.id}`} className='hover:underline'>
                          {row.fullName || row.email}
                        </Link>
                      </div>
                      <div className='text-xs text-muted-foreground'>{row.email}</div>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  header: 'Role',
                  cell: (row: AdminUserRow) =>
                    row.role === 'admin' ? (
                      <Badge className='gap-1' variant='default'>
                        <ShieldCheck className='h-3.5 w-3.5' />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant='secondary'>Normal</Badge>
                    ),
                },
                {
                  key: 'createdAt',
                  header: 'Created',
                  cell: (row: AdminUserRow) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
                },
                {
                  key: 'lastLoginAt',
                  header: 'Last login',
                  cell: (row: AdminUserRow) =>
                    row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : '—',
                },
              ]}
              data={users.data}
              searchable
              searchPlaceholder='Search users...'
              searchValue={String(query.search || '')}
              onSearchChange={(value) => searchTable(String(value || ''))}
              pagination={{
                page: users.meta.currentPage,
                pageSize: users.meta.perPage,
                total: users.meta.total,
                onPageChange: changePage,
                onPageSizeChange: changeRows,
              }}
              emptyMessage='No users found'
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

