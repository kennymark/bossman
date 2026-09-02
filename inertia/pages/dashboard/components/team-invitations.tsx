import { IconCopy, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { AppCard } from '@/components/ui/app-card'
import { BaseDialog } from '@/components/ui/base-dialog'
import { BaseModal } from '@/components/ui/base-modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { HStack } from '@/components/ui/hstack'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Stack } from '@/components/ui/stack'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

export type PageKey =
  | 'analytics'
  | 'dashboard'
  | 'teams'
  | 'blog'
  | 'orgs'
  | 'leases'
  | 'properties'
  | 'pushNotifications'
  | 'dbBackups'
  | 'emails'
  | 'servers'
  | 'addons'

export const PAGE_OPTIONS: Array<{
  key: PageKey
  label: string
  description: string
  required?: boolean
}> = [
  { key: 'dashboard', label: 'Dashboard', description: 'Overview and activity' },
  { key: 'analytics', label: 'Analytics', description: 'Analytics and reporting' },
  { key: 'teams', label: 'Teams', description: 'Manage teams and invites' },
  { key: 'blog', label: 'Blog', description: 'Manage blog posts and categories' },
  { key: 'orgs', label: 'Organisations', description: 'Organisations and customers' },
  { key: 'leases', label: 'Leases', description: 'Leases and tenancies' },
  { key: 'properties', label: 'Properties', description: 'Properties and leaseable entities' },
  {
    key: 'pushNotifications',
    label: 'Push notifications',
    description: 'Send and manage push notifications',
  },
  { key: 'dbBackups', label: 'DB backups', description: 'Create and manage database backups' },
  { key: 'emails', label: 'Emails', description: 'View sent emails (Resend)' },
  { key: 'servers', label: 'Servers', description: 'Railway projects and deployments' },
  { key: 'addons', label: 'Addons', description: 'Manage addons' },
]

export type InviteRole = 'owner' | 'admin' | 'member'

export const INVITE_ROLE_OPTIONS: Array<{ value: InviteRole; label: string }> = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

export function togglePageInSet(pages: PageKey[], key: PageKey, next: boolean): PageKey[] {
  const set = new Set(pages)
  if (next) set.add(key)
  else set.delete(key)
  return Array.from(set)
}

export interface InvitationRow {
  id: string
  email: string
  role: string
  createdAt: string
  invitedBy?: { fullName?: string | null; email?: string | null } | null
  allowedPages: PageKey[] | null
  enableProdAccess: boolean
}

export function TeamInvitationsInviteButton() {
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteRole>('member')
  const [invitePages, setInvitePages] = useState<PageKey[]>(
    PAGE_OPTIONS.filter((o) => o.key !== 'dashboard').map((o) => o.key),
  )
  const [enableProdAccess, setEnableProdAccess] = useState(true)

  const inviteMutation = useMutation({
    mutationFn: (payload: {
      email: string
      role: InviteRole
      allowedPages: PageKey[]
      enableProdAccess: boolean
    }) =>
      api.teamInvitations.invite({
        body: {
          email: payload.email,
          role: payload.role,
          allowedPages: payload.allowedPages,
          enableProdAccess: payload.enableProdAccess,
        },
      }),
    onSuccess: async () => {
      setInviteEmail('')
      setInviteRole('member')
      setInvitePages(PAGE_OPTIONS.filter((o) => o.key !== 'dashboard').map((o) => o.key))
      setEnableProdAccess(true)
      toast.success('Invite sent successfully')
      await queryClient.invalidateQueries({
        queryKey: ['dashboard-invitations'],
      })
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to send invite', {
        description: 'Please try again.',
      })
    },
  })

  const toggleInvitePage = (key: PageKey, next: boolean) => {
    setInvitePages((prev) => togglePageInSet(prev, key, next))
  }

  return (
    <BaseModal
      title='Invite member'
      description='Select the pages this person can access, then send the invite.'
      trigger={
        <Button
          leftIcon={<IconPlus className='h-4 w-4' />}
          isLoading={inviteMutation.isPending}
          loadingText='Sending invite...'>
          Invite member
        </Button>
      }
      primaryText='Send invite'
      secondaryText='Cancel'
      primaryVariant='default'
      secondaryVariant='outline'
      isLoading={inviteMutation.isPending}
      primaryDisabled={!inviteEmail.trim()}
      onPrimaryAction={async () => {
        const email = inviteEmail.trim()
        if (!email) return
        inviteMutation.mutate({
          email,
          role: inviteRole,
          allowedPages: invitePages,
          enableProdAccess,
        })
      }}
      onSecondaryAction={() => {
        setInviteEmail('')
        setInviteRole('member')
        setInvitePages(PAGE_OPTIONS.filter((o) => o.key !== 'dashboard').map((o) => o.key))
        setEnableProdAccess(true)
      }}
      className='max-w-2xl'>
      <Stack spacing={4}>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='inviteEmail'>Invite by email</Label>
            <Input
              id='inviteEmail'
              type='email'
              placeholder='staff@company.com'
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='inviteRole'>Role</Label>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as InviteRole)}>
              <SelectTrigger id='inviteRole' className='w-full'>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                {INVITE_ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='flex items-center justify-between rounded-lg border border-border p-3'>
          <div>
            <Label htmlFor='inviteProdAccess'>Enabled Prod access</Label>
            <p className='text-xs text-muted-foreground'>
              If off, the invited member will only be able to access the dev database, not
              production.
            </p>
          </div>
          <Switch
            id='inviteProdAccess'
            checked={enableProdAccess}
            onCheckedChange={setEnableProdAccess}
          />
        </div>

        <div className='space-y-2'>
          <HStack spacing={2} justify='between' align='center'>
            <Label>Page access</Label>
            <span className='text-sm'>
              <button
                type='button'
                onClick={() => setInvitePages(PAGE_OPTIONS.map((o) => o.key))}
                className='text-primary hover:underline'>
                Select all
              </button>
              <span className='text-muted-foreground'> · </span>
              <button
                type='button'
                onClick={() => setInvitePages([])}
                className='text-primary hover:underline'>
                Clear all
              </button>
            </span>
          </HStack>
          <div className='max-h-[280px] overflow-y-auto rounded-lg border border-border p-3'>
            <div className='grid gap-2'>
              {PAGE_OPTIONS.map((opt) => {
                const checked = invitePages.includes(opt.key)
                const disabled = Boolean(opt.required)
                return (
                  <HStack key={opt.key} spacing={3} align='start'>
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(v) => toggleInvitePage(opt.key, v)}
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
          <p className='text-xs text-muted-foreground'>
            Select which pages the invitee can access after accepting.
          </p>
        </div>
      </Stack>
    </BaseModal>
  )
}

export function TeamInvitations() {
  const queryClient = useQueryClient()
  const [editInvitation, setEditInvitation] = useState<InvitationRow | null>(null)
  const [editInvitationPages, setEditInvitationPages] = useState<PageKey[]>(
    PAGE_OPTIONS.map((o) => o.key),
  )
  const [editEnableProdAccess, setEditEnableProdAccess] = useState(true)

  const invitationsQuery = useQuery({
    queryKey: ['dashboard-invitations'],
    queryFn: async () => {
      const res = await api.members.invitations({})
      /** Serialized on the wire; the inferred row type is the Lucid model. */
      return res.data as unknown as { invitations: InvitationRow[] }
    },
  })

  const invitationRows = invitationsQuery.data?.invitations ?? []

  const updateInvitationMutation = useMutation({
    mutationFn: async ({
      invitationId,
      allowedPages,
      enableProdAccess,
    }: {
      invitationId: string
      allowedPages: PageKey[]
      enableProdAccess: boolean
    }) => {
      await api.teamInvitations.updateInvitation({
        params: { invitationId },
        body: { allowedPages, enableProdAccess },
      })
    },
    onSuccess: () => {
      setEditInvitation(null)
      toast.success('Invitation updated')
      queryClient.invalidateQueries({ queryKey: ['dashboard-invitations'] })
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update invitation')
    },
  })

  const openEditInvitation = (inv: InvitationRow) => {
    setEditInvitation(inv)
    setEditInvitationPages(
      inv.allowedPages?.length ? [...inv.allowedPages] : PAGE_OPTIONS.map((o) => o.key),
    )
    setEditEnableProdAccess(inv.enableProdAccess ?? true)
  }

  const copyInviteLinkMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await api.teamInvitations.inviteLink({ params: { invitationId } })
    },
    onSuccess: async (data) => {
      if (data?.inviteLink) {
        await navigator.clipboard.writeText(data.inviteLink)
        toast.success('Invite link copied to clipboard')
      }
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to get invite link')
    },
  })

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.teamInvitations.destroy({ params: { invitationId } })
    },
    onSuccess: () => {
      toast.success('Invitation deleted')
      queryClient.invalidateQueries({ queryKey: ['dashboard-invitations'] })
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to delete invitation')
    },
  })

  return (
    <>
      {invitationRows.length > 0 && (
        <AppCard title='Pending invitations' description='Invitations waiting for acceptance.'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Page access</TableHead>
                  <TableHead>Prod access</TableHead>
                  <TableHead>Invited by</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitationRows.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className='font-medium'>{inv.email}</div>
                      <div className='text-xs text-muted-foreground capitalize'>{inv.role}</div>
                    </TableCell>
                    <TableCell>
                      {!inv.allowedPages?.length ? (
                        <span className='text-sm text-muted-foreground'>All</span>
                      ) : (
                        <span className='text-sm text-muted-foreground'>
                          {inv.allowedPages
                            .map((k) => PAGE_OPTIONS.find((o) => o.key === k)?.label || k)
                            .join(', ')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {inv.enableProdAccess ? 'Yes' : 'Dev only'}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {inv.invitedBy?.fullName ?? inv.invitedBy?.email ?? '—'}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <HStack spacing={1}>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label='Copy invite link'
                          onClick={() => copyInviteLinkMutation.mutate(inv.id)}
                          disabled={copyInviteLinkMutation.isPending}>
                          <IconCopy className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label='Edit page access'
                          onClick={() => openEditInvitation(inv)}>
                          <IconPencil className='h-4 w-4' />
                        </Button>
                        <BaseDialog
                          title='Delete invitation?'
                          description={`This will revoke the invitation sent to ${inv.email}. They will no longer be able to use the invite link. This cannot be undone.`}
                          trigger={
                            <Button
                              variant='ghost'
                              size='icon'
                              aria-label='Delete invitation'
                              disabled={deleteInvitationMutation.isPending}
                              className='text-destructive hover:bg-destructive/10 hover:text-destructive'>
                              <IconTrash className='h-4 w-4' />
                            </Button>
                          }
                          primaryText='Delete'
                          secondaryText='Cancel'
                          primaryVariant='destructive'
                          isLoading={deleteInvitationMutation.isPending}
                          onPrimaryAction={() => deleteInvitationMutation.mutate(inv.id)}
                        />
                      </HStack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AppCard>
      )}

      <BaseModal
        title='Edit invitation page access'
        description={
          editInvitation
            ? `Choose which pages ${editInvitation.email} will have access to after accepting.`
            : ''
        }
        open={Boolean(editInvitation)}
        onOpenChange={(open) => !open && setEditInvitation(null)}
        primaryText='Save'
        secondaryText='Cancel'
        primaryVariant='default'
        secondaryVariant='outline'
        isLoading={updateInvitationMutation.isPending}
        onSecondaryAction={() => setEditInvitation(null)}
        onPrimaryAction={() => {
          if (!editInvitation) return
          updateInvitationMutation.mutate({
            invitationId: editInvitation.id,
            allowedPages: editInvitationPages,
            enableProdAccess: editEnableProdAccess,
          })
        }}
        className='max-w-2xl'>
        <Stack spacing={4}>
          <div className='flex items-center justify-between rounded-lg border border-border p-3'>
            <div>
              <Label htmlFor='editProdAccess'>Enabled Prod access</Label>
              <p className='text-xs text-muted-foreground'>
                If off, this member will only access the dev database, not production.
              </p>
            </div>
            <Switch
              id='editProdAccess'
              checked={editEnableProdAccess}
              onCheckedChange={setEditEnableProdAccess}
            />
          </div>
          <div className='space-y-2'>
            <HStack spacing={2} justify='between' align='center'>
              <Label>Page access</Label>
              <span className='text-sm'>
                <button
                  type='button'
                  onClick={() => setEditInvitationPages(PAGE_OPTIONS.map((o) => o.key))}
                  className='text-primary hover:underline'>
                  Select all
                </button>
                <span className='text-muted-foreground'> · </span>
                <button
                  type='button'
                  onClick={() => setEditInvitationPages([])}
                  className='text-primary hover:underline'>
                  Clear all
                </button>
              </span>
            </HStack>
            <div className='max-h-[280px] overflow-y-auto rounded-lg border border-border p-3'>
              <div className='grid gap-2'>
                {PAGE_OPTIONS.map((opt) => {
                  const checked = editInvitationPages.includes(opt.key)
                  const disabled = Boolean(opt.required)
                  return (
                    <HStack key={opt.key} spacing={3} align='start'>
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={(v) =>
                          setEditInvitationPages((prev) =>
                            togglePageInSet(prev, opt.key, v === true),
                          )
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
            <p className='text-xs text-muted-foreground'>
              Select which pages the invitee can access.
            </p>
          </div>
        </Stack>
      </BaseModal>
    </>
  )
}
