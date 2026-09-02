import type { SharedProps } from '@adonisjs/inertia/types'
import { router } from '@inertiajs/react'
import { IconFileText, IconHome, IconStack } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'

import type { RawTeamMember } from '#types/model-types'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import DetailRow from '@/components/dashboard/detail-row'
import { SimpleGrid } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { EmptyState } from '@/components/ui/empty-state'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

type ProdAccessMode = 'read' | 'write'

interface MemberShowProps extends SharedProps {
  member: RawTeamMember
}

const accessModeOptions = [
  { value: 'all', label: 'All', description: 'Member can see all' },
  { value: 'selected', label: 'Selected', description: 'Member can only see items you choose' },
]

const prodAccessModeOptions = [
  {
    value: 'read',
    label: 'Read-only',
    description: 'Can view production data; every change to it is refused.',
  },
  {
    value: 'write',
    label: 'Read & write',
    description: 'Can view and change production data.',
  },
]

interface UpdateMemberPayload {
  enableProdAccess: boolean
  propertiesAccessMode: 'all' | 'selected'
  leasesAccessMode: 'all' | 'selected'
  allowedLeaseableEntityIds: string[]
  allowedLeaseIds: string[]
  /** Optional time limit on access to properties & leases; empty = no limit. */
  dataAccessExpiresAt: string
  /** Optional time limit on production database access; empty = no limit. */
  prodAccessExpiresAt: string
  /** Required when switching production access on or changing its mode; audited. */
  prodAccessReason?: string
  /** Read-only lets the member look at production without being able to change it. */
  prodAccessMode: ProdAccessMode
}
export default function MemberShow({ member }: MemberShowProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'leases'>('properties')
  const [propertiesAccessMode, setPropertiesAccessMode] = useState<'all' | 'selected'>(
    member.propertiesAccessMode ?? member.dataAccessMode ?? 'all',
  )
  const [leasesAccessMode, setLeasesAccessMode] = useState<'all' | 'selected'>(
    member.leasesAccessMode ?? member.dataAccessMode ?? 'all',
  )
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(
    new Set(member.allowedLeaseableEntityIds ?? []),
  )
  const [selectedLeaseIds, setSelectedLeaseIds] = useState<Set<string>>(
    new Set(member.allowedLeaseIds ?? []),
  )
  const [enableProdAccess, setEnableProdAccess] = useState(member.enableProdAccess ?? true)
  const [prodAccessExpiresAt, setProdAccessExpiresAt] = useState<string>(
    member.prodAccessExpiresAt ? new Date(member.prodAccessExpiresAt).toISOString() : '',
  )
  const [prodAccessReason, setProdAccessReason] = useState('')
  const [prodAccessMode, setProdAccessMode] = useState<ProdAccessMode>(
    member.prodAccessMode === 'read' ? 'read' : 'write',
  )

  /** Turning the grant on is what needs justifying; turning it off never does. */
  const grantingProdAccess = enableProdAccess && !member.enableProdAccess
  /** So does changing the mode: read-only to read & write widens what they can do. */
  const changingProdAccessMode =
    enableProdAccess && prodAccessMode !== (member.prodAccessMode === 'read' ? 'read' : 'write')
  const prodReasonRequired = grantingProdAccess || changingProdAccessMode
  const [dataAccessExpiresAt, setDataAccessExpiresAt] = useState<string>(
    member.dataAccessExpiresAt ? new Date(member.dataAccessExpiresAt).toISOString() : '',
  )

  const { data: optionsData, isLoading: optionsLoading } = useQuery({
    queryKey: ['members', 'data-access-options'],
    queryFn: async () => {
      const res = await api.members.dataAccessOptions({})
      return res.data
    },
    enabled: propertiesAccessMode === 'selected' || leasesAccessMode === 'selected',
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateMemberPayload) =>
      api.members.updateMember({ params: { memberId: member.id }, body: payload }),
    onSuccess: () => {
      toast.success('Data access updated')
      router.reload()
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update data access')
    },
  })

  const toggleProperty = (id: string, checked: boolean) => {
    setSelectedPropertyIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleLease = (id: string, checked: boolean) => {
    setSelectedLeaseIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleSave = () => {
    updateMutation.mutate({
      enableProdAccess: Boolean(enableProdAccess),
      propertiesAccessMode,
      leasesAccessMode,
      allowedLeaseableEntityIds: Array.from(selectedPropertyIds),
      allowedLeaseIds: Array.from(selectedLeaseIds),
      dataAccessExpiresAt: dataAccessExpiresAt.trim() || '',
      prodAccessExpiresAt: prodAccessExpiresAt.trim() || '',
      prodAccessReason: prodAccessReason.trim() || undefined,
      prodAccessMode,
    })
  }

  const displayName = member.user?.fullName || member.user?.email || 'Member'
  const leaseableEntities = optionsData?.leaseableEntities ?? []
  const leases = optionsData?.leases ?? []

  return (
    <DashboardPage
      title={`${displayName} – Team member`}
      description='Manage this team member’s data access to properties and leases.'
      backHref='/teams'>
      <AppCard title='Member' description='Team member details'>
        <SimpleGrid cols={4}>
          <DetailRow label='Name' value={member.user?.fullName ?? '—'} />
          <DetailRow label='Email' value={member.user?.email ?? '—'} />
          <DetailRow
            label='Role'
            value={member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : '—'}
          />
        </SimpleGrid>
        <div className='mt-6 space-y-4 rounded-lg border border-border p-3'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <Label htmlFor='member-prod-access'>Enable Prod access</Label>
              <p className='text-xs text-muted-foreground'>
                If off, this member can only access the dev database, not production.
              </p>
            </div>
            <div className='flex items-center gap-3 shrink-0'>
              <Switch
                id='member-prod-access'
                checked={enableProdAccess}
                onCheckedChange={setEnableProdAccess}
              />
              <Button
                size='sm'
                variant='secondary'
                onClick={handleSave}
                isLoading={updateMutation.isPending}
                loadingText='Saving…'
                disabled={prodReasonRequired && prodAccessReason.trim().length < 8}>
                Save
              </Button>
            </div>
          </div>

          {enableProdAccess && (
            <div className='space-y-3 border-t border-border pt-4'>
              <Label>Production access mode</Label>
              <RadioGroup
                value={prodAccessMode}
                onChange={(v) => setProdAccessMode(v === 'read' ? 'read' : 'write')}
                options={prodAccessModeOptions}
                cols={2}
              />
              <p className='text-xs text-muted-foreground'>
                Read-only still shows everything in production; only changes to customer data are
                refused. Team, blog, email and server pages are unaffected.
              </p>
            </div>
          )}

          {enableProdAccess && (
            <div className='grid gap-4 sm:grid-cols-2 border-t border-border pt-4'>
              <div className='space-y-2'>
                <Label htmlFor='member-prod-expiry'>Production access expires</Label>
                <Input
                  id='member-prod-expiry'
                  type='datetime-local'
                  value={
                    prodAccessExpiresAt
                      ? format(new Date(prodAccessExpiresAt), "yyyy-MM-dd'T'HH:mm")
                      : ''
                  }
                  onChange={(e) =>
                    setProdAccessExpiresAt(
                      e.target.value ? new Date(e.target.value).toISOString() : '',
                    )
                  }
                />
                <p className='text-xs text-muted-foreground'>
                  Leave empty for no expiry. Once it passes, the member drops back to the dev
                  database automatically.
                </p>
              </div>

              {prodReasonRequired && (
                <div className='space-y-2'>
                  <Label htmlFor='member-prod-reason'>
                    {grantingProdAccess ? 'Reason for granting' : 'Reason for changing the mode'}
                  </Label>
                  <Input
                    id='member-prod-reason'
                    value={prodAccessReason}
                    onChange={(e) => setProdAccessReason(e.target.value)}
                    placeholder='e.g. Investigating billing incident #482'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Required, and recorded in the audit trail.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </AppCard>

      <AppCard
        title='Data access'
        description='Choose All or Selected for each tab. When Selected, pick which items this member can access.'>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'properties' | 'leases')}>
          <TabsList className='grid w-full grid-cols-2 max-w-md'>
            <TabsTrigger value='properties' className='flex items-center gap-2'>
              <IconStack className='h-4 w-4' />
              Properties
            </TabsTrigger>
            <TabsTrigger value='leases' className='flex items-center gap-2'>
              <IconFileText className='h-4 w-4' />
              Leases
            </TabsTrigger>
          </TabsList>

          <TabsContent value='properties' className='mt-6 space-y-4'>
            <div className='space-y-3'>
              <Label>Properties access</Label>
              <RadioGroup
                value={propertiesAccessMode}
                onChange={(v) => setPropertiesAccessMode(v as 'all' | 'selected')}
                options={accessModeOptions}
                cols={2}
              />
            </div>
            {propertiesAccessMode === 'selected' && (
              <div className='space-y-2'>
                <Label>Select properties</Label>
                <p className='text-xs text-muted-foreground'>
                  Choose which properties this member can access.
                </p>
                <div className='rounded-lg border border-border p-3 max-h-64 overflow-y-auto'>
                  {optionsLoading ? (
                    <p className='text-sm text-muted-foreground'>Loading properties…</p>
                  ) : leaseableEntities.length === 0 ? (
                    <EmptyState
                      icon={IconHome}
                      title='No properties found'
                      description='No properties available to assign.'
                      className='py-6'
                    />
                  ) : (
                    <div className='space-y-1.5'>
                      {leaseableEntities.map((e) => (
                        <label
                          key={e.id}
                          htmlFor={`prop-${e.id}`}
                          className='flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50'>
                          <Checkbox
                            id={`prop-${e.id}`}
                            checked={selectedPropertyIds.has(e.id)}
                            onCheckedChange={(v) => toggleProperty(e.id, v === true)}
                          />
                          <span className='text-sm truncate'>{e.address || e.id}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value='leases' className='mt-6 space-y-4'>
            <div className='space-y-3'>
              <Label>Leases access</Label>
              <RadioGroup
                value={leasesAccessMode}
                onChange={(v) => setLeasesAccessMode(v as 'all' | 'selected')}
                options={accessModeOptions}
                cols={2}
              />
            </div>
            {leasesAccessMode === 'selected' && (
              <div className='space-y-2'>
                <Label>Select leases</Label>
                <p className='text-xs text-muted-foreground'>
                  Choose which leases this member can access.
                </p>
                <div className='rounded-lg border border-border p-3 max-h-64 overflow-y-auto'>
                  {optionsLoading ? (
                    <p className='text-sm text-muted-foreground'>Loading leases…</p>
                  ) : leases.length === 0 ? (
                    <EmptyState
                      icon={IconFileText}
                      title='No leases found'
                      description='No leases available to assign.'
                      className='py-6'
                    />
                  ) : (
                    <div className='space-y-1.5'>
                      {leases.map((l) => (
                        <label
                          key={l.id}
                          htmlFor={`lease-${l.id}`}
                          className='flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50'>
                          <Checkbox
                            id={`lease-${l.id}`}
                            checked={selectedLeaseIds.has(l.id)}
                            onCheckedChange={(v) => toggleLease(l.id, v === true)}
                          />
                          <span className='text-sm truncate'>{l.name || l.id}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className='mt-6 space-y-4 max-w-md'>
          <FormField
            label='Access to properties & leases expires at'
            htmlFor='member-data-access-expires-at'
            description='Optional. Leave empty for no time limit. After this time the member will see no properties or leases.'>
            <DateTimePicker
              placeholder='No time limit'
              clearable
              value={
                dataAccessExpiresAt
                  ? format(new Date(dataAccessExpiresAt), "yyyy-MM-dd'T'HH:mm")
                  : ''
              }
              onChange={(value) =>
                setDataAccessExpiresAt(value ? new Date(value).toISOString() : '')
              }
            />
          </FormField>
          <Button onClick={handleSave} isLoading={updateMutation.isPending} loadingText='Saving…'>
            Save data access
          </Button>
        </div>
      </AppCard>
    </DashboardPage>
  )
}
