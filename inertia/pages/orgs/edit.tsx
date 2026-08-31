import type { SharedProps } from '@adonisjs/inertia/types'
import { Link, router } from '@inertiajs/react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { toast } from 'sonner'
import * as Yup from 'yup'

import type { RawOrg } from '#types/model-types'
import { startCase } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { LoadingOverlay, OnlyShowIf } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { RadioGroup } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { Switch } from '@/components/ui/switch'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

interface OrgsEditProps extends SharedProps {
  org: RawOrg
}

const ownerRoleOptions = [
  {
    value: 'landlord',
    label: 'Landlord',
    description: 'Individual or entity that owns the property.',
  },
  { value: 'agency', label: 'Agency', description: 'Manages properties on behalf of landlords.' },
]

const editOrgSchema = Yup.object({
  name: Yup.string(),
  creatorEmail: Yup.string().email('Enter a valid email').nullable(),
  companyName: Yup.string(),
  companyWebsite: Yup.string().url('Enter a valid URL').nullable(),
  companyEmail: Yup.string().email('Enter a valid email').nullable(),
  country: Yup.string(),
  ownerRole: Yup.string().oneOf(['landlord', 'agency']).required(),
  isWhiteLabelEnabled: Yup.boolean(),
  customPaymentSchedule: Yup.object({
    amount: Yup.number()
      .transform((v) => (v === '' || v == null || Number.isNaN(Number(v)) ? 0 : Number(v)))
      .min(0),
    trialPeriodInDays: Yup.number()
      .transform((v) => (v === '' || v == null || Number.isNaN(Number(v)) ? 0 : Number(v)))
      .min(0),
    frequency: Yup.string().oneOf(['monthly', 'quarterly', 'yearly']),
    currency: Yup.string().oneOf(['gbp', 'eur', 'usd']),
    paymentMethod: Yup.string().oneOf(['stripe', 'bank_transfer']),
    planType: Yup.string().oneOf(['normal', 'custom']),
    plan: Yup.string().oneOf(['standard', 'essential', 'premium']),
  })
    .nullable()
    .default(null),
  customPlanFeatures: Yup.object({
    propertyLimit: Yup.number().min(0),
    tenantLimit: Yup.number().min(0),
    storageLimit: Yup.number().min(0),
    teamSizeLimit: Yup.number().min(0),
    prioritySupport: Yup.boolean(),
    activityLogRetention: Yup.number().min(0),
    depositProtection: Yup.boolean(),
    advancedReporting: Yup.boolean(),
    eSignDocsLimit: Yup.number().min(0),
    aiInvocationLimit: Yup.number().min(0),
    customTemplatesLimit: Yup.number().min(0),
  })
    .nullable()
    .default(null),
  settings: Yup.object({
    preferredCurrency: Yup.string().nullable(),
    preferredTimezone: Yup.string().nullable(),
    preferredDateFormat: Yup.string().nullable(),
    weeklyDigest: Yup.boolean(),
    monthlyDigest: Yup.boolean(),
    autoArchiveLeases: Yup.boolean(),
    enablePayments: Yup.boolean(),
    notifications: Yup.object({
      leaseExpiry: Yup.boolean(),
      rentPaymentReminder: Yup.boolean(),
    }),
  }),
})

type EditOrgFormValues = Yup.InferType<typeof editOrgSchema>

function getInitialValues(org: RawOrg): EditOrgFormValues {
  const cps = org.customPaymentSchedule as Record<string, unknown> | undefined
  const cpf = org.customPlanFeatures as Record<string, unknown> | undefined
  return {
    name: org.cleanName,
    creatorEmail: org.creatorEmail,
    companyName: org.companyName ?? '',
    companyWebsite: org.companyWebsite ?? '',
    companyEmail: org.companyEmail ?? '',
    country: org.country ?? '',
    ownerRole: (org.ownerRole as 'landlord' | 'agency') ?? 'landlord',
    isWhiteLabelEnabled: org.isWhiteLabelEnabled ?? false,
    customPaymentSchedule:
      org.isOnCustomPlan && cps
        ? {
            amount: (Number(cps?.amount) || 0) as number,
            trialPeriodInDays: (Number(cps.trialPeriodInDays) || 0) as number,
            frequency: (cps?.frequency as 'monthly' | 'quarterly' | 'yearly') ?? 'monthly',
            currency: (cps?.currency as 'gbp' | 'eur' | 'usd') ?? 'gbp',
            paymentMethod: (cps?.paymentMethod as 'stripe' | 'bank_transfer') ?? 'stripe',
            planType: (cps.planType as 'normal' | 'custom') ?? 'custom',
            plan: (cps?.plan as 'standard' | 'essential' | 'premium') ?? 'standard',
          }
        : null,
    customPlanFeatures:
      org.isOnCustomPlan && cpf
        ? {
            propertyLimit: Number(cpf?.propertyLimit) ?? 0,
            tenantLimit: Number(cpf?.tenantLimit) ?? 0,
            storageLimit: Number(cpf?.storageLimit) ?? 0,
            teamSizeLimit: Number(cpf?.teamSizeLimit) ?? 0,
            prioritySupport: Boolean(cpf.prioritySupport),
            activityLogRetention: Number(cpf?.activityLogRetention) ?? 0,
            depositProtection: Boolean(cpf.depositProtection),
            advancedReporting: Boolean(cpf?.advancedReporting),
            eSignDocsLimit: Number(cpf.eSignDocsLimit) ?? 0,
            aiInvocationLimit: Number(cpf.aiInvocationLimit) ?? 0,
            customTemplatesLimit: Number(cpf.customTemplatesLimit) ?? 0,
          }
        : null,
    settings: {
      preferredCurrency: org.settings?.preferredCurrency ?? '',
      preferredTimezone: org.settings?.preferredTimezone ?? '',
      preferredDateFormat: org.settings?.preferredDateFormat ?? '',
      weeklyDigest: org.settings?.weeklyDigest ?? false,
      monthlyDigest: org.settings?.monthlyDigest ?? false,
      autoArchiveLeases: org.settings?.autoArchiveLeases ?? false,
      enablePayments: org.settings?.enablePayments ?? false,
      notifications: {
        leaseExpiry: org.settings?.notifications?.leaseExpiry ?? false,
        rentPaymentReminder: org.settings?.notifications?.rentPaymentReminder ?? false,
      },
    },
  }
}

export default function OrgsEdit({ org }: OrgsEditProps) {
  console.log('🚀 ~ OrgsEdit ~ org:', org)
  const id = org.id
  const cleanName = org.cleanName

  const formik = useFormik<EditOrgFormValues>({
    initialValues: getInitialValues(org),
    validationSchema: editOrgSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit(values) {
      updateOrgMutation(values)
    },
  })
  console.log('🚀 ~ formik: errors', formik.errors)
  const { values, handleChange, setFieldValue, touched, errors } = formik

  const { mutate: updateOrgMutation, isPending } = useMutation({
    mutationFn: (values: EditOrgFormValues) => api.put(`/orgs/${id}`, values),
    onSuccess: () => {
      toast.success('Organisation updated successfully.')
      router.visit(`/orgs/${id}`)
    },
    onError: (error: ServerErrorResponse) => {
      toast.error(serverErrorResponder(error) || 'Failed to update organisation.')
    },
  })

  return (
    <DashboardPage
      title={`Edit ${cleanName}`}
      description='Update organisation details and settings.'
      backHref={`/orgs/${id}`}
      actions={
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='md' asChild>
            <Link href={`/orgs/${id}`}>Cancel</Link>
          </Button>
          <Button size='md' onClick={() => formik.handleSubmit()} disabled={isPending}>
            Save changes
          </Button>
        </div>
      }>
      <LoadingOverlay isLoading={isPending} text='Updating organisation...' />
      <form onSubmit={formik.handleSubmit} className='space-y-6'>
        <AppCard title='Organisation' description='Name, contact and type.'>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
            <FormField label='Name' htmlFor='name' error={touched.name && errors.name}>
              <Input
                id='name'
                name='name'
                value={values.name}
                onChange={handleChange}
                placeholder='Organisation name (display)'
              />
            </FormField>
            <FormField
              label='Creator email'
              htmlFor='creatorEmail'
              error={touched.creatorEmail && errors.creatorEmail}>
              <Input
                id='creatorEmail'
                type='email'
                {...formik.getFieldProps('creatorEmail')}
                placeholder='creator@example.com'
              />
            </FormField>
          </SimpleGrid>
          <div className='pb-4 pt-4'>
            <p className='text-sm font-medium mb-2'>Owner type</p>
            <RadioGroup
              spacing={2}
              cols={2}
              options={ownerRoleOptions}
              value={values.ownerRole}
              onChange={(value) => setFieldValue('ownerRole', value)}
            />
          </div>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
            <FormField
              label='Company name'
              htmlFor='companyName'
              error={touched.companyName && errors.companyName}>
              <Input
                id='companyName'
                {...formik.getFieldProps('companyName')}
                placeholder='Company name'
              />
            </FormField>
            <FormField
              label='Company website'
              htmlFor='companyWebsite'
              error={touched.companyWebsite && errors.companyWebsite}>
              <Input
                id='companyWebsite'
                type='url'
                {...formik.getFieldProps('companyWebsite')}
                placeholder='https://example.com'
              />
            </FormField>
            <FormField
              label='Company email'
              htmlFor='companyEmail'
              error={touched.companyEmail && errors.companyEmail}>
              <Input
                id='companyEmail'
                type='email'
                {...formik.getFieldProps('companyEmail')}
                placeholder='hello@example.com'
              />
            </FormField>
            <FormField label='Country' htmlFor='country' error={touched.country && errors.country}>
              <Input
                id='country'
                {...formik.getFieldProps('country')}
                placeholder='e.g. United Kingdom'
              />
            </FormField>
            <div className='flex items-center gap-2'>
              <Switch
                id='isWhiteLabelEnabled'
                checked={values.isWhiteLabelEnabled}
                onCheckedChange={(checked) => setFieldValue('isWhiteLabelEnabled', checked)}
              />
              <label htmlFor='isWhiteLabelEnabled' className='text-sm font-medium'>
                White label enabled
              </label>
            </div>
          </SimpleGrid>
        </AppCard>

        <OnlyShowIf condition={org.isOnCustomPlan}>
          <AppCard title='Custom payment schedule' description='Billing and plan.'>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
              <FormField label='Frequency' htmlFor='customPaymentSchedule.frequency'>
                <Select
                  value={values.customPaymentSchedule?.frequency}
                  itemToStringLabel={(item) => startCase(item)}
                  onValueChange={(v) => setFieldValue('customPaymentSchedule.frequency', v)}>
                  <SelectTrigger id='customPaymentSchedule.frequency'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='monthly'>Monthly</SelectItem>
                    <SelectItem value='quarterly'>Quarterly</SelectItem>
                    <SelectItem value='yearly'>Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label='Currency' htmlFor='customPaymentSchedule.currency'>
                <Select
                  value={values.customPaymentSchedule?.currency}
                  itemToStringLabel={(item) => String(item).toUpperCase()}
                  onValueChange={(v) => setFieldValue('customPaymentSchedule.currency', v)}>
                  <SelectTrigger id='customPaymentSchedule.currency'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='gbp'>GBP</SelectItem>
                    <SelectItem value='eur'>EUR</SelectItem>
                    <SelectItem value='usd'>USD</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label='Cost per tenancy' htmlFor='customPaymentSchedule.amount'>
                <Input
                  id='customPaymentSchedule.amount'
                  {...formik.getFieldProps('customPaymentSchedule.amount')}
                  type='number'
                  min={0}
                  step={0.5}
                  value={values.customPaymentSchedule?.amount}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label='Free trial days' htmlFor='customPaymentSchedule.trialPeriodInDays'>
                <Input
                  id='customPaymentSchedule.trialPeriodInDays'
                  {...formik.getFieldProps('customPaymentSchedule.trialPeriodInDays')}
                  type='number'
                  min={0}
                />
              </FormField>
              <FormField label='Payment method' htmlFor='customPaymentSchedule.paymentMethod'>
                <Select
                  value={values.customPaymentSchedule?.paymentMethod}
                  itemToStringLabel={(item) => startCase(String(item).replace('_', ' '))}
                  onValueChange={(v) => setFieldValue('customPaymentSchedule.paymentMethod', v)}>
                  <SelectTrigger id='customPaymentSchedule.paymentMethod'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='stripe'>Stripe</SelectItem>
                    <SelectItem value='bank_transfer'>Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </SimpleGrid>
          </AppCard>
        </OnlyShowIf>

        <OnlyShowIf condition={org.isOnCustomPlan && values.customPlanFeatures != null}>
          <AppCard title='Custom plan features' description='Limits and feature flags.'>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
              <FormField label='Property limit' htmlFor='customPlanFeatures.propertyLimit'>
                <Input
                  id='customPlanFeatures.propertyLimit'
                  name='customPlanFeatures.propertyLimit'
                  type='number'
                  min={0}
                  value={values.customPlanFeatures?.propertyLimit}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label='Tenant limit' htmlFor='customPlanFeatures.tenantLimit'>
                <Input
                  id='customPlanFeatures.tenantLimit'
                  name='customPlanFeatures.tenantLimit'
                  type='number'
                  min={0}
                  value={values.customPlanFeatures?.tenantLimit}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label='Team size limit' htmlFor='customPlanFeatures.teamSizeLimit'>
                <Input
                  id='customPlanFeatures.teamSizeLimit'
                  name='customPlanFeatures.teamSizeLimit'
                  type='number'
                  min={0}
                  value={values.customPlanFeatures?.teamSizeLimit}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label='Storage limit (GB)' htmlFor='customPlanFeatures.storageLimit'>
                <Input
                  id='customPlanFeatures.storageLimit'
                  name='customPlanFeatures.storageLimit'
                  type='number'
                  min={0}
                  step={0.5}
                  value={values.customPlanFeatures?.storageLimit}
                  onChange={handleChange}
                />
              </FormField>
              <FormField
                label='e-Sign limit (per month)'
                htmlFor='customPlanFeatures.eSignDocsLimit'>
                <Input
                  id='customPlanFeatures.eSignDocsLimit'
                  name='customPlanFeatures.eSignDocsLimit'
                  type='number'
                  min={0}
                  value={values.customPlanFeatures?.eSignDocsLimit}
                  onChange={handleChange}
                />
              </FormField>
              <FormField
                label='AI messages limit (per month)'
                htmlFor='customPlanFeatures.aiInvocationLimit'>
                <Input
                  id='customPlanFeatures.aiInvocationLimit'
                  name='customPlanFeatures.aiInvocationLimit'
                  type='number'
                  min={0}
                  value={values.customPlanFeatures?.aiInvocationLimit}
                  onChange={handleChange}
                />
              </FormField>
              <FormField
                label='Custom templates limit'
                htmlFor='customPlanFeatures.customTemplatesLimit'>
                <Input
                  id='customPlanFeatures.customTemplatesLimit'
                  name='customPlanFeatures.customTemplatesLimit'
                  type='number'
                  min={0}
                  value={values.customPlanFeatures?.customTemplatesLimit}
                  onChange={handleChange}
                />
              </FormField>
              <FormField
                label='Activity log retention'
                htmlFor='customPlanFeatures.activityLogRetention'>
                <Input
                  id='customPlanFeatures.activityLogRetention'
                  name='customPlanFeatures.activityLogRetention'
                  type='number'
                  min={0}
                  value={values.customPlanFeatures?.activityLogRetention}
                  onChange={handleChange}
                />
              </FormField>
            </SimpleGrid>
            <div className='mt-4 flex flex-wrap gap-6'>
              <div className='flex items-center gap-2'>
                <Switch
                  id='customPlanFeatures.prioritySupport'
                  checked={values.customPlanFeatures?.prioritySupport}
                  onCheckedChange={(v) => setFieldValue('customPlanFeatures.prioritySupport', v)}
                />
                <label htmlFor='customPlanFeatures.prioritySupport' className='text-sm font-medium'>
                  Priority support
                </label>
              </div>
              <div className='flex items-center gap-2'>
                <Switch
                  id='customPlanFeatures.depositProtection'
                  checked={values.customPlanFeatures?.depositProtection}
                  onCheckedChange={(v) => setFieldValue('customPlanFeatures.depositProtection', v)}
                />
                <label
                  htmlFor='customPlanFeatures.depositProtection'
                  className='text-sm font-medium'>
                  Deposit protection
                </label>
              </div>
              <div className='flex items-center gap-2'>
                <Switch
                  id='customPlanFeatures.advancedReporting'
                  checked={values.customPlanFeatures?.advancedReporting}
                  onCheckedChange={(v) => setFieldValue('customPlanFeatures.advancedReporting', v)}
                />
                <label
                  htmlFor='customPlanFeatures.advancedReporting'
                  className='text-sm font-medium'>
                  Advanced reporting
                </label>
              </div>
            </div>
          </AppCard>
        </OnlyShowIf>

        <AppCard title='Settings' description='Preferences and notifications.'>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
            <FormField label='Preferred currency' htmlFor='settings.preferredCurrency'>
              <Input
                id='settings.preferredCurrency'
                name='settings.preferredCurrency'
                value={values.settings.preferredCurrency ?? ''}
                onChange={handleChange}
                placeholder='e.g. GBP'
              />
            </FormField>
            <FormField label='Preferred timezone' htmlFor='settings.preferredTimezone'>
              <Input
                id='settings.preferredTimezone'
                name='settings.preferredTimezone'
                value={values.settings.preferredTimezone ?? ''}
                onChange={handleChange}
                placeholder='e.g. Europe/London'
              />
            </FormField>
            <FormField label='Preferred date format' htmlFor='settings.preferredDateFormat'>
              <Input
                id='settings.preferredDateFormat'
                name='settings.preferredDateFormat'
                value={values.settings.preferredDateFormat ?? ''}
                onChange={handleChange}
                placeholder='e.g. DD/MM/YYYY'
              />
            </FormField>
            <div className='flex items-center gap-2'>
              <Switch
                id='settings.weeklyDigest'
                checked={values.settings.weeklyDigest}
                onCheckedChange={(checked) => setFieldValue('settings.weeklyDigest', checked)}
              />
              <label htmlFor='settings.weeklyDigest' className='text-sm font-medium'>
                Weekly digest
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='settings.monthlyDigest'
                checked={values.settings.monthlyDigest}
                onCheckedChange={(checked) => setFieldValue('settings.monthlyDigest', checked)}
              />
              <label htmlFor='settings.monthlyDigest' className='text-sm font-medium'>
                Monthly digest
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='settings.autoArchiveLeases'
                checked={values.settings.autoArchiveLeases}
                onCheckedChange={(checked) => setFieldValue('settings.autoArchiveLeases', checked)}
              />
              <label htmlFor='settings.autoArchiveLeases' className='text-sm font-medium'>
                Auto archive leases
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='settings.enablePayments'
                checked={values.settings.enablePayments}
                onCheckedChange={(checked) => setFieldValue('settings.enablePayments', checked)}
              />
              <label htmlFor='settings.enablePayments' className='text-sm font-medium'>
                Enable payments
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='settings.notifications.leaseExpiry'
                checked={values.settings?.notifications?.leaseExpiry ?? false}
                onCheckedChange={(checked) =>
                  setFieldValue('settings.notifications.leaseExpiry', checked)
                }
              />
              <label htmlFor='settings.notifications.leaseExpiry' className='text-sm font-medium'>
                Lease expiry notifications
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <Switch
                id='settings.notifications.rentPaymentReminder'
                checked={values.settings?.notifications?.rentPaymentReminder ?? false}
                onCheckedChange={(checked) =>
                  setFieldValue('settings.notifications.rentPaymentReminder', checked)
                }
              />
              <label
                htmlFor='settings.notifications.rentPaymentReminder'
                className='text-sm font-medium'>
                Rent payment reminders
              </label>
            </div>
          </SimpleGrid>
        </AppCard>
      </form>
    </DashboardPage>
  )
}
