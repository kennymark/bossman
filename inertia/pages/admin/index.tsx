import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link } from '@inertiajs/react'
import { Activity, Users } from 'lucide-react'
import type { PaginatedResponse } from '#types/extra'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HStack } from '@/components/ui/hstack'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { Stack } from '@/components/ui/stack'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type ActivityRow = {
  id: number
  event: string
  auditable_type: string
  auditable_id: number
  user_id: string | null
  user_email: string | null
  user_full_name: string | null
  created_at: string | null
}

interface AdminIndexProps extends SharedProps {
  stats: {
    totalUsers: number
    totalActivity: number
  }
  activities: PaginatedResponse<ActivityRow>
}

export default function AdminIndex({ stats, activities }: AdminIndexProps) {
  return (
    <DashboardLayout>
      <Head title='Admin' />
      <div className='space-y-6'>
        <HStack
          justify='between'
          align='center'
          className='flex-col sm:flex-row gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Overview</h1>
            <p className='text-muted-foreground'>Manage users and monitor platform activity.</p>
          </div>
          <Button asChild>
            <Link href='/users'>View users</Link>
          </Button>
        </HStack>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardHeader>
              <Stack spacing={1}>
                <HStack spacing={2} align='center'>
                  <Users className='h-4 w-4' />
                  <CardTitle>Total users</CardTitle>
                </HStack>
                <CardDescription>All accounts in the system.</CardDescription>
              </Stack>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-semibold'>{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Stack spacing={1}>
                <HStack spacing={2} align='center'>
                  <Activity className='h-4 w-4' />
                  <CardTitle>Total activity</CardTitle>
                </HStack>
                <CardDescription>All audit events recorded.</CardDescription>
              </Stack>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-semibold'>{stats.totalActivity}</div>
            </CardContent>
          </Card>
        </SimpleGrid>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest audit events across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className='text-right'>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant='secondary'>{row.event}</Badge>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {row.auditable_type}#{row.auditable_id}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {row.user_full_name || row.user_email || row.user_id || '—'}
                    </TableCell>
                    <TableCell className='text-right text-muted-foreground'>
                      {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {!activities.data.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-center text-muted-foreground'>
                      No activity yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <HStack justify='between' align='center' className='mt-4'>
              <div className='text-sm text-muted-foreground'>
                Page {activities.meta.currentPage} of {activities.meta.lastPage}
              </div>
              <Button variant='outline' asChild>
                <Link href='/users'>Manage users</Link>
              </Button>
            </HStack>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

