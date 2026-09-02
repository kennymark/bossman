import type { SharedProps } from '@adonisjs/inertia/types'
import { Deferred, Link, router } from '@inertiajs/react'
import { IconPencil, IconSettings, IconTrash } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { Column, PaginatedResponse } from '#types/extra'
import type { RawTeamMember } from '#types/model-types'
import { timeAgo } from '#utils/date'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DataTable } from '@/components/dashboard/data-table'
import { LoadingSkeleton } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { BaseDialog } from '@/components/ui/base-dialog'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HStack } from '@/components/ui/hstack'
import { Label } from '@/components/ui/label'
import { Stack } from '@/components/ui/stack'
import { Switch } from '@/components/ui/switch'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'
import { tablePagination } from '@/lib/pagination'
import {
  PAGE_OPTIONS,
  type PageKey,
  TeamInvitations,
  TeamInvitationsInviteButton,
  togglePageInSet,
} from '@/pages/dashboard/components/team-invitations'

const memberColumns: Column<RawTeamMember>[] = [
  {
    key: 'user',
    header: 'Member',
    sortable: true,
    cell(row) {
      const name = row.user?.fullName || row.user?.email || '—'
      const email = row.user?.email
      return (
        <div>
          <div className='font-medium'>{name}</div>
          {email && name !== email && <div className='text-xs text-muted-foreground'>{email}</div>}
        </div>
      )
    },
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    cell: (row) => <span className='capitalize'>{row.role}</span>,
  },
  {
    key: 'allowedPages',
    header: 'Page access',
    cell: (row) => {
      if (!row.allowedPages?.length)
        return <span className='text-sm text-muted-foreground'>All</span>
      const label = row.allowedPages
        .map((k) => PAGE_OPTIONS.find((o) => o.key === k)?.label || k)
        .join(', ')
      return <span className='text-sm text-muted-foreground'>{label}</span>
    },
  },
  { key: 'createdAt', header: 'Joined', cell: (row) => timeAgo(row.createdAt) },
]

interface TeamsPageProps extends SharedProps {
  members?: PaginatedResponse<RawTeamMember>
}

export default function TeamsPage({ members }: TeamsPageProps) {
  const queryClient = useQueryClient()
  const { query, changePage, changeRows, searchTable } = useInertiaParams({
    page: 1,
    perPage: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'asc',
  })
  const [editMember, setEditMember] = useState<RawTeamMember | null>(null)
  const [editMemberPages, setEditMemberPages] = useState<PageKey[]>(PAGE_OPTIONS.map((o) => o.key))
  const [editEnableProdAccess, setEditEnableProdAccess] = useState(true)

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      memberId,
      allowedPages,
      enableProdAccess,
    }: {
      memberId: string
      allowedPages: PageKey[]
      enableProdAccess: boolean
    }) => {
      await api.members.updateMember({
        params: { memberId },
        body: { allowedPages, enableProdAccess },
      })
    },
    onSuccess: () => {
      setEditMember(null)
      toast.success('Member updated')
      queryClient.invalidateQueries({ queryKey: ['dashboard-members'] })
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update member')
    },
  })

  const openEditMember = (row: RawTeamMember) => {
    setEditMember(row)
    setEditMemberPages(
      row.allowedPages?.length
        ? [...(row.allowedPages as PageKey[])]
        : PAGE_OPTIONS.map((o) => o.key),
    )
    setEditEnableProdAccess(row.enableProdAccess ?? true)
  }

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.members.destroy({ params: { memberId } })
    },
    onSuccess: () => {
      toast.success('Member removed')
      queryClient.invalidateQueries({ queryKey: ['dashboard-members'] })
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to remove member')
    },
  })

  const memberColumnsWithActions: Column<RawTeamMember>[] = useMemo(
    () => [
      ...memberColumns,
      {
        key: 'actions',
        header: '',
        cell: (row) => (
          <div className='flex items-center gap-1'>
            <Link
              href={`/teams/members/${row.id}`}
              className='inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground h-9 w-9'
              aria-label='Member settings'>
              <IconSettings className='h-4 w-4' />
            </Link>
            <Button
              variant='ghost'
              size='xs'
              aria-label='Edit page access'
              onClick={() => openEditMember(row)}>
              <IconPencil className='h-4 w-4' />
            </Button>
            <BaseDialog
              title='Remove member?'
              description={`${row.user?.fullName || row.user?.email || 'This member'} will lose access to the dashboard. They can be invited again later.`}
              trigger={
                <Button
                  variant='ghost'
                  size='xs'
                  aria-label='Remove member'
                  disabled={deleteMemberMutation.isPending}
                  className='text-destructive hover:bg-destructive/10 hover:text-destructive'>
                  <IconTrash className='h-4 w-4' />
                </Button>
              }
              primaryText='Remove'
              secondaryText='Cancel'
              primaryVariant='destructive'
              isLoading={deleteMemberMutation.isPending}
              onPrimaryAction={() => deleteMemberMutation.mutate(row.id)}
            />
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <DashboardPage
      title='Team members'
      description='Invite users and control which pages they can access.'
      actions={<TeamInvitationsInviteButton />}>
      <TeamInvitations />

      <Deferred data='members' fallback={<LoadingSkeleton type='table' />}>
        <AppCard title='Members' description='Users with dashboard access.'>
          <DataTable
            columns={memberColumnsWithActions}
            data={members?.data ?? []}
            searchable
            searchPlaceholder='Search members...'
            searchValue={String(query.search ?? '')}
            onSearchChange={(value) => {
              searchTable(value)
              changePage(1)
            }}
            pagination={tablePagination(members, {
              onPageChange: changePage,
              onPageSizeChange: (pageSize) => {
                changeRows(pageSize)
                changePage(1)
              },
            })}
            emptyMessage='No members found'
          />
        </AppCard>
      </Deferred>

      {/* Edit member page access modal */}
      <BaseModal
        title='Edit page access'
        description={
          editMember
            ? `Choose which pages ${editMember.user?.fullName || editMember.user?.email || 'this member'} can access.`
            : ''
        }
        open={Boolean(editMember)}
        onOpenChange={(open) => !open && setEditMember(null)}
        primaryText='Save'
        secondaryText='Cancel'
        primaryVariant='default'
        secondaryVariant='outline'
        isLoading={updateMemberMutation.isPending}
        onSecondaryAction={() => setEditMember(null)}
        onPrimaryAction={() => {
          if (!editMember) return
          updateMemberMutation.mutate({
            memberId: editMember.id,
            allowedPages: editMemberPages,
            enableProdAccess: editEnableProdAccess,
          })
        }}
        className='max-w-2xl'>
        <Stack spacing={4}>
          <div className='flex items-center justify-between rounded-lg border border-border p-3'>
            <div>
              <Label htmlFor='edit-member-prod-access'>Enable Prod access</Label>
              <p className='text-xs text-muted-foreground'>
                If off, this member can only access the dev database, not production.
              </p>
            </div>
            <Switch
              id='edit-member-prod-access'
              checked={editEnableProdAccess}
              onCheckedChange={setEditEnableProdAccess}
            />
          </div>
          <div className='space-y-2'>
            <Label>Page access</Label>
            <div className='max-h-[280px] overflow-y-auto rounded-lg border border-border p-3'>
              <div className='grid gap-2'>
                {PAGE_OPTIONS.map((opt) => {
                  const checked = editMemberPages.includes(opt.key)
                  const disabled = Boolean(opt.required)
                  return (
                    <HStack key={opt.key} spacing={3} align='start'>
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={(v) =>
                          setEditMemberPages((prev) => togglePageInSet(prev, opt.key, v === true))
                        }
                      />
                      <div className='min-w-0'>
                        <div className='text-sm font-medium'>{opt.label}</div>
                        <div className='text-xs text-muted-foreground'>{opt.description}</div>
                      </div>
                    </HStack>
                  )
                })}
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>Dashboard is always included.</p>
          </div>
        </Stack>
      </BaseModal>
    </DashboardPage>
  )
}
