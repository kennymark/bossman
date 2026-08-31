import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link, router } from '@inertiajs/react'
import {
  IconBuildingStore,
  IconFlask,
  IconPencil,
  IconStar,
  IconStarOff,
  IconTrash,
  IconUserCheck,
  IconUserX,
} from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { useState } from 'react'
import { toast } from 'sonner'
import * as Yup from 'yup'

import type { RawOrg } from '#types/model-types'
import { formatCurrency } from '#utils/currency'
import { timeAgo } from '#utils/date'
import { startCase } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import DetailRow from '@/components/dashboard/detail-row'
import { type QuickActionOption, QuickActions } from '@/components/dashboard/quick-actions'
import { DateTimePicker, OnlyShowIf, SimpleGrid } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { BaseDialog } from '@/components/ui/base-dialog'
import { BaseSheet } from '@/components/ui/base-sheet'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form_field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useInertiaParams } from '@/hooks/use-inertia-params'
import { dateFormatter } from '@/lib/date'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

import { ActivitiesTab } from './components/activities-tab'
import { InvoicesTab } from './components/invoices-tab'
import { LeasesTab } from './components/leases-tab'
import { PropertiesTab } from './components/properties-tab'

interface OrgShowProps extends SharedProps {
  org: RawOrg
  isLoopsUser: boolean
}

const banUserSchema = Yup.object({
  reason: Yup.string().trim().required('Reason is required'),
  isInstantSend: Yup.boolean(),
  isTemporarilyPaused: Yup.boolean(),
  banStartsAt: Yup.string().when('isInstantSend', {
    is: false,
    then: (schema) => schema.required('Start date is required when not banning immediately'),
  }),
  expiresAt: Yup.string().when('isTemporarilyPaused', {
    is: true,
    then: (schema) => schema.required('Expiry date is required for a temporary ban'),
  }),
})

export default function OrgShow({ org, isLoopsUser }: OrgShowProps) {
  const { query, updateQuery } = useInertiaParams()
  const qs = query as { tab?: string }
  const currentTab = qs.tab ?? 'details'
  const [banUserSheetOpen, setBanUserSheetOpen] = useState(false)
  const [requestDeleteDialogOpen, setRequestDeleteDialogOpen] = useState(false)

  const id = String(org.id ?? '')
  const cleanName = String(org.cleanName ?? org.companyName ?? org.name ?? 'Organisation')
  const ownerRole = String(org.ownerRole ?? '—')
  const country = String(org.country ?? '—')
  const hasActiveSubscription = org?.hasActiveSubscription

  const { data: banStatus, refetch: refetchBanStatus } = useQuery({
    queryKey: ['org', id, 'ban-status'],
    queryFn: () => api.get<{ isBanned: boolean }>(`/orgs/${id}/ban-status`),
    select: (res) => res?.data,
  })

  const handleTabChange = (value: string) => {
    updateQuery({ tab: value })
  }

  const { mutate: banUser, isPending: isBanning } = useMutation({
    mutationFn: (values: typeof banUserFormik.values) =>
      api.post(`/orgs/${id}/actions/ban-user`, values),
    onSuccess: () => {
      setBanUserSheetOpen(false)
      banUserFormik.resetForm()
      router.reload()
      refetchBanStatus()
      toast.success('User banned successfully.')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to ban user.')
    },
  })

  const banUserFormik = useFormik({
    initialValues: {
      reason: '',
      isInstantSend: true,
      isTemporarilyPaused: false,
      banStartsAt: '',
      expiresAt: '',
    },
    validationSchema: banUserSchema,
    onSubmit: (values) => {
      banUser(values)
    },
  })

  const unbanUserMutation = useMutation({
    mutationFn: () => api.post(`/orgs/${id}/actions/unban-user`, {}),
    onSuccess: () => {
      refetchBanStatus()
      toast.success('User unbanned successfully.')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Failed to unban user.')
    },
  })

  const makeFavouriteMutation = useMutation({
    mutationFn: () => api.post(`/orgs/${id}/actions/make-favourite`, {}),
    onSuccess: () => {
      router.reload()
      toast.success('Marked as favourite.')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update.')
    },
  })

  const undoFavouriteMutation = useMutation({
    mutationFn: () => api.post(`/orgs/${id}/actions/undo-favourite`, {}),
    onSuccess: () => {
      router.reload()
      toast.success('Removed from favourites.')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update.')
    },
  })

  const makeTestAccountMutation = useMutation({
    mutationFn: () => api.post(`/orgs/${id}/actions/make-test-account`, {}),
    onSuccess: () => {
      router.reload()
      toast.success('Marked as test account.')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update.')
    },
  })

  const undoTestAccountMutation = useMutation({
    mutationFn: () => api.post(`/orgs/${id}/actions/undo-test-account`, {}),
    onSuccess: () => {
      router.reload()
      toast.success('Removed test account flag.')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update.')
    },
  })

  const toggleSalesAccountMutation = useMutation({
    mutationFn: () =>
      api.post<{ message: string; isSalesOrg: boolean }>(
        `/orgs/${id}/actions/toggle-sales-account`,
        {},
      ),
    onSuccess: (res) => {
      router.reload()
      toast.success(res?.data?.message ?? 'Updated.')
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to update.')
    },
  })

  const requestDeleteCustomUserMutation = useMutation({
    mutationFn: () => api.post(`/orgs/${id}/actions/request-delete-custom-user`, {}),
    onSuccess: () => {
      setRequestDeleteDialogOpen(false)
      toast.success(
        'Delete request email sent. The user can accept or decline from the link in the email.',
      )
    },
    onError: (err: ServerErrorResponse) => {
      toast.error(serverErrorResponder(err) || 'Failed to send delete request.')
    },
  })

  const quickActions: QuickActionOption[] = [
    {
      title: 'Ban user',
      description: 'Ban the org owner from the platform.',
      icon: IconUserX,
      onClick: () => setBanUserSheetOpen(true),
      dontShowIf: banStatus?.isBanned,
    },
    {
      title: 'Unban user',
      description: 'Remove the ban from the org owner.',
      icon: IconUserCheck,
      onClick: () => unbanUserMutation.mutate(),
      dontShowIf: !banStatus?.isBanned,
    },
    {
      title: 'Make favourite',
      description: 'Mark this org as a favourite.',
      icon: IconStar,
      onClick: () => makeFavouriteMutation.mutate(),
      dontShowIf: org.isFavourite,
    },
    {
      title: 'Undo favourite',
      description: 'Remove favourite from this org.',
      icon: IconStarOff,
      onClick: () => undoFavouriteMutation.mutate(),
      dontShowIf: !org.isFavourite,
    },
    {
      title: 'Make test account',
      description: 'Mark this org as a test account.',
      icon: IconFlask,
      onClick: () => makeTestAccountMutation.mutate(),
      dontShowIf: org.isTestAccount,
    },
    {
      title: 'Undo test account',
      description: 'Remove test account flag from this org.',
      icon: IconFlask,
      onClick: () => undoTestAccountMutation.mutate(),
      dontShowIf: !org.isTestAccount,
    },
    {
      title: 'Make sales account',
      description: 'Mark this org as a sales account.',
      icon: IconBuildingStore,
      onClick: () => toggleSalesAccountMutation.mutate(),
      dontShowIf: org.isSalesOrg,
    },
    {
      title: 'Undo sales account',
      description: 'Remove sales account flag from this org.',
      icon: IconBuildingStore,
      onClick: () => toggleSalesAccountMutation.mutate(),
      dontShowIf: !org.isSalesOrg,
    },
    {
      title: 'Request delete user',
      description: 'Send an email to the user so they can accept or decline account deletion.',
      icon: IconTrash,
      onClick: () => setRequestDeleteDialogOpen(true),
    },
  ]

  return (
    <DashboardPage
      title={cleanName}
      description={org.companyName ? String(org.companyName) : undefined}
      backHref='/orgs'
      actions={
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='md' asChild>
            <Link href={`/orgs/${id}/edit`}>
              <IconPencil className='mr-2 h-4 w-4' />
              Edit
            </Link>
          </Button>
          <Button variant='outline' size='md' asChild>
            <Link href={`/orgs/${id}/invoices/create`}>Create invoice</Link>
          </Button>
          <QuickActions options={quickActions} />
        </div>
      }>
      <BaseSheet
        open={banUserSheetOpen}
        onOpenChange={setBanUserSheetOpen}
        title='Ban user'
        description='Ban the org owner for this organisation. Provide a reason and optionally schedule or set an expiry.'
        side='right'
        className='w-full sm:max-w-md'
        primaryText='Ban user'
        primaryVariant='destructive'
        secondaryText='Cancel'
        onSecondaryAction={() => setBanUserSheetOpen(false)}
        isLoading={isBanning}
        primaryDisabled={isBanning}
        showFooter
        showSecondary>
        <form id='ban-user-form' onSubmit={banUserFormik.handleSubmit} className='space-y-4'>
          <FormField
            label='Reason'
            htmlFor='ban-reason'
            required
            error={banUserFormik.touched.reason ? banUserFormik.errors.reason : undefined}>
            <Textarea
              id='ban-reason'
              name='reason'
              value={banUserFormik.values.reason}
              onChange={banUserFormik.handleChange}
              onBlur={banUserFormik.handleBlur}
              placeholder='e.g. Terms of service violation'
              rows={3}
              className='resize-none'
            />
          </FormField>
          <div className='flex items-center justify-between gap-2'>
            <Label htmlFor='ban-instant' className='text-sm font-medium'>
              Ban immediately
            </Label>
            <Switch
              id='ban-instant'
              checked={banUserFormik.values.isInstantSend}
              onCheckedChange={(checked) => banUserFormik.setFieldValue('isInstantSend', checked)}
            />
          </div>
          {!banUserFormik.values.isInstantSend && (
            <FormField
              label='Ban starts at'
              htmlFor='ban-starts-at'
              error={
                banUserFormik.touched.banStartsAt ? banUserFormik.errors.banStartsAt : undefined
              }>
              <DateTimePicker
                id='ban-starts-at'
                value={banUserFormik.values.banStartsAt || undefined}
                onChange={(v) => banUserFormik.setFieldValue('banStartsAt', v ?? '')}
                placeholder='Pick date & time'
                clearable
              />
            </FormField>
          )}
          <div className='flex items-center justify-between gap-2'>
            <Label htmlFor='ban-temporary' className='text-sm font-medium'>
              Temporary ban (set expiry)
            </Label>
            <Switch
              id='ban-temporary'
              checked={banUserFormik.values.isTemporarilyPaused}
              onCheckedChange={(checked) =>
                banUserFormik.setFieldValue('isTemporarilyPaused', checked)
              }
            />
          </div>
          {banUserFormik.values.isTemporarilyPaused && (
            <FormField
              label='Expires at'
              htmlFor='ban-expires-at'
              error={banUserFormik.touched.expiresAt ? banUserFormik.errors.expiresAt : undefined}>
              <DateTimePicker
                id='ban-expires-at'
                value={banUserFormik.values.expiresAt || undefined}
                onChange={(v) => banUserFormik.setFieldValue('expiresAt', v ?? '')}
                placeholder='Pick date & time'
                clearable
              />
            </FormField>
          )}
        </form>
      </BaseSheet>

      <BaseDialog
        open={requestDeleteDialogOpen}
        onOpenChange={setRequestDeleteDialogOpen}
        title='Request delete custom user'
        description='An email will be sent to the org owner with a link to accept or decline the account deletion. If they accept, they will be redirected to a confirmation page and their account will be permanently deleted.'
        primaryText='Send email'
        secondaryText='Cancel'
        primaryVariant='destructive'
        isLoading={requestDeleteCustomUserMutation.isPending}
        onPrimaryAction={() => requestDeleteCustomUserMutation.mutate()}
        onSecondaryAction={() => setRequestDeleteDialogOpen(false)}
      />

      <Tabs value={currentTab} onValueChange={handleTabChange} className='space-y-6'>
        <TabsList>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value='leases'>Leases</TabsTrigger>
          <TabsTrigger value='properties'>Properties</TabsTrigger>
          <TabsTrigger value='activities'>Activities</TabsTrigger>
          <TabsTrigger value='invoices'>Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='space-y-6'>
          <AppCard
            title='User information'
            description='Details and identifiers'
            className='space-y-6'>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              <DetailRow
                label='Owner type'
                value={
                  <Badge variant='outline' className='w-fit capitalize'>
                    {ownerRole}
                  </Badge>
                }
              />
              <DetailRow label='Country' value={country} />
              <DetailRow
                label='Subscription'
                value={
                  <Badge variant={hasActiveSubscription ? 'default' : 'secondary'}>
                    {hasActiveSubscription ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
              {banStatus?.isBanned && (
                <DetailRow
                  label='Account'
                  value={
                    <Badge variant='destructive' className='w-fit'>
                      Banned
                    </Badge>
                  }
                />
              )}
              {org.isFavourite && (
                <DetailRow
                  label='Favourite'
                  value={
                    <Badge variant='secondary' className='w-fit gap-1'>
                      <IconStar className='h-3 w-3' />
                      Yes
                    </Badge>
                  }
                />
              )}
              {org.isTestAccount && (
                <DetailRow
                  label='Test account'
                  value={
                    <Badge variant='outline' className='w-fit gap-1'>
                      <IconFlask className='h-3 w-3' />
                      Yes
                    </Badge>
                  }
                />
              )}
              {org.isSalesOrg && (
                <DetailRow
                  label='Sales account'
                  value={
                    <Badge variant='secondary' className='w-fit gap-1'>
                      <IconBuildingStore className='h-3 w-3' />
                      Yes
                    </Badge>
                  }
                />
              )}
              <DetailRow
                label='Loops user'
                value={
                  <Badge variant={isLoopsUser ? 'default' : 'secondary'} className='w-fit'>
                    {isLoopsUser ? 'Yes' : 'No'}
                  </Badge>
                }
              />

              <DetailRow label='Creator email' value={String(org.creatorEmail)} />

              <DetailRow label='Custom Plan' value={org.isOnCustomPlan ? 'Yes' : 'No'} />
              <DetailRow
                label='Joined at'
                value={`${dateFormatter(org.createdAt)} (${timeAgo(org.createdAt)})`}
              />
            </div>
          </AppCard>

          <OnlyShowIf condition={org.isOnCustomPlan}>
            <AppCard title='Custom Plan' description='Custom plan features'>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
                <DetailRow
                  label='Tenant limit'
                  value={org.customPlanFeatures?.tenantLimit ?? '—'}
                />
                <DetailRow
                  label='Team member limit'
                  value={org.customPlanFeatures?.teamMemberLimit ?? '—'}
                />
                <DetailRow
                  label='Storage limit'
                  value={org.customPlanFeatures?.storageLimit ?? '—'}
                />
                <DetailRow
                  label='Property limit'
                  value={org.customPlanFeatures?.propertyLimit ?? '—'}
                />
                <DetailRow
                  label='Activity log retention'
                  value={org.customPlanFeatures?.activityLogRetention ?? '—'}
                />
                <DetailRow
                  label='Deposit protection'
                  value={org.customPlanFeatures?.depositProtection ?? '—'}
                />
                <DetailRow
                  label='Advanced reporting'
                  value={org.customPlanFeatures?.advancedReporting ?? '—'}
                />
                <DetailRow
                  label='E-sign docs limit'
                  value={org.customPlanFeatures?.eSignDocsLimit ?? '—'}
                />
                <DetailRow
                  label='AI invocation limit'
                  value={org.customPlanFeatures?.aiInvocationLimit ?? '—'}
                />
                <DetailRow
                  label='Custom templates limit'
                  value={org.customPlanFeatures?.customTemplatesLimit ?? '—'}
                />
              </SimpleGrid>
            </AppCard>

            <AppCard title='Custom payment schedule' description='Custom payment schedule'>
              <SimpleGrid cols={3}>
                <DetailRow
                  label='Cost per tenant'
                  value={formatCurrency(
                    org.customPaymentSchedule?.amount,
                    org.customPaymentSchedule?.currency,
                  )}
                />
                <DetailRow
                  label='Trial period'
                  value={org.customPaymentSchedule?.trialPeriodInDays}
                />
                <DetailRow
                  label='Frequency'
                  value={startCase(org.customPaymentSchedule?.frequency)}
                />
                {org.customPaymentSchedule?.promoCode && (
                  <DetailRow label='Promo code' value={org.customPaymentSchedule.promoCode} />
                )}
                <DetailRow label='Promo code' value={org.customPaymentSchedule?.promoCode} />
              </SimpleGrid>
            </AppCard>

            <AppCard title='Pages' description='Enabled sections for this customer'>
              <SimpleGrid cols={3}>
                {org?.pages?.orgPages.map((page: { label: string; isEnabled: boolean }) => (
                  <DetailRow
                    key={page.label}
                    label={page.label}
                    value={page.isEnabled ? 'Yes' : 'No'}
                  />
                ))}
              </SimpleGrid>
            </AppCard>
          </OnlyShowIf>

          <AppCard
            title='Settings'
            description="Configure the org's settings."
            className='space-y-6'>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
              <DetailRow
                label='Preferred currency'
                value={org.settings?.preferredCurrency ?? '—'}
              />
              <DetailRow
                label='Preferred timezone'
                value={org.settings?.preferredTimezone ?? '—'}
              />
              <DetailRow
                label='Preferred date format'
                value={org.settings?.preferredDateFormat ?? '—'}
              />
              <DetailRow label='Weekly digest' value={org.settings?.weeklyDigest ? 'Yes' : 'No'} />
              <DetailRow
                label='Monthly digest'
                value={org.settings?.monthlyDigest ? 'Yes' : 'No'}
              />
              <DetailRow
                label='Auto archive leases'
                value={org.settings?.autoArchiveLeases ? 'Yes' : 'No'}
              />
              <DetailRow
                label='Enable payments'
                value={org.settings?.enablePayments ? 'Yes' : 'No'}
              />
              <DetailRow label='Notifications' value={org.settings?.notifications ? 'Yes' : 'No'} />
            </SimpleGrid>
          </AppCard>
        </TabsContent>

        <TabsContent value='leases' className='space-y-6'>
          <LeasesTab orgId={id} />
        </TabsContent>

        <TabsContent value='properties' className='space-y-6'>
          <PropertiesTab orgId={id} />
        </TabsContent>

        <TabsContent value='activities' className='space-y-6'>
          <ActivitiesTab orgId={id} />
        </TabsContent>

        <TabsContent value='invoices' className='space-y-6'>
          <InvoicesTab orgId={id} />
        </TabsContent>
      </Tabs>
    </DashboardPage>
  )
}
