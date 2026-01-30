import type { FormikProps } from 'formik'
import { startCase } from '#utils/functions'
import { OnlyShowIf } from '@/components/ui'
import { AppCard } from '@/components/ui/app-card'
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
import type { CreateCustomerFormValues } from '../create-form'

interface CreateCustomerFormStepTwoProps {
  formik: FormikProps<CreateCustomerFormValues>
}

const planTypeOptions = [
  { value: 'normal', label: 'Normal', description: 'Normal plan from the website' },
  { value: 'custom', label: 'Custom', description: 'Custom plan for a new user' },
]
export function CreateCustomerFormStepTwo({ formik }: CreateCustomerFormStepTwoProps) {
  const { values, setFieldValue, getFieldProps } = formik
  const ps = values.customPaymentSchedule
  const fl = values.featureList

  return (
    <div className='space-y-6'>
      <AppCard title='Subscription' description='Payment schedule and plan.'>
        <div className='pb-4'>
          <p className='text-sm font-medium mb-2'>Plan type </p>
          <RadioGroup
            spacing={2}
            options={planTypeOptions}
            orientation='horizontal'
            value={values.customPaymentSchedule.planType}
            onChange={(value) => formik.setFieldValue('customPaymentSchedule.planType', value)}
          />
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          <FormField label='Frequency' htmlFor='customPaymentSchedule.frequency'>
            <Select
              value={ps.frequency}
              itemToStringLabel={(item) => startCase(item)}
              onValueChange={(v) =>
                setFieldValue('customPaymentSchedule.frequency', v as typeof ps.frequency)
              }>
              <SelectTrigger id='customPaymentSchedule.frequency'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='monthly'>Monthly</SelectItem>
                <OnlyShowIf condition={values.customPaymentSchedule.planType === 'custom'}>
                  <SelectItem value='quarterly'>Quarterly</SelectItem>
                </OnlyShowIf>
                <SelectItem value='yearly'>Yearly</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label='Plan' htmlFor='customPaymentSchedule.plan'>
            <Select
              itemToStringLabel={(item) => startCase(item)}
              value={ps.plan}
              onValueChange={(v) =>
                setFieldValue('customPaymentSchedule.plan', v as typeof ps.plan)
              }>
              <SelectTrigger id='customPaymentSchedule.plan'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='standard'>Standard</SelectItem>
                <SelectItem value='essential'>Essential</SelectItem>
                <SelectItem value='premium'>Premium</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <OnlyShowIf condition={values.customPaymentSchedule.planType === 'custom'}>
            <FormField label='Currency' htmlFor='customPaymentSchedule.currency'>
              <Select
                value={ps.currency}
                itemToStringLabel={(item) => startCase(item)}
                onValueChange={(v) =>
                  setFieldValue('customPaymentSchedule.currency', v as typeof ps.currency)
                }>
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

            <FormField label='Amount' htmlFor='customPaymentSchedule.amount'>
              <Input
                id='customPaymentSchedule.amount'
                type='number'
                min={0}
                step={0.5}
                {...getFieldProps('customPaymentSchedule.amount')}
              />
            </FormField>

            <FormField label='Free trial days' htmlFor='customPaymentSchedule.trialPeriodInDays'>
              <Input
                id='customPaymentSchedule.trialPeriodInDays'
                type='number'
                min={0}
                {...getFieldProps('customPaymentSchedule.trialPeriodInDays')}
              />
            </FormField>

            <FormField label='Payment method' htmlFor='customPaymentSchedule.paymentMethod'>
              <Select
                value={ps.paymentMethod}
                onValueChange={(v) =>
                  setFieldValue('customPaymentSchedule.paymentMethod', v as typeof ps.paymentMethod)
                }>
                <SelectTrigger id='customPaymentSchedule.paymentMethod'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='stripe'>Stripe</SelectItem>
                  <SelectItem value='bank_transfer'>Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </OnlyShowIf>
        </div>
      </AppCard>

      <AppCard
        className='space-y-2'
        title='Enable pages'
        description='Choose which sections are available for this customer.'>
        {values.pages.orgPages.map((page, index) => (
          <div
            key={page.label}
            className='flex items-center justify-between rounded-lg border p-4 space-y-2'>
            <div>
              <p className='font-medium'>{page.label}</p>
              {page.children?.length ? (
                <p className='text-xs text-muted-foreground'>{page.children.join(', ')}</p>
              ) : null}
            </div>
            <Switch
              checked={page.isEnabled}
              onCheckedChange={(checked) => {
                const next = [...values.pages.orgPages]
                next[index] = { ...next[index], isEnabled: checked }
                setFieldValue('pages', { orgPages: next })
              }}
            />
          </div>
        ))}
      </AppCard>

      <AppCard title='Features' description='Limits and feature flags.'>
        <SimpleGrid cols={4} className='mb-4'>
          <FormField label='Property limit'>
            <Input
              type='number'
              min={0}
              value={fl.propertyLimit}
              onChange={(e) =>
                setFieldValue('featureList.propertyLimit', Number(e.target.value) || 0)
              }
            />
          </FormField>
          <FormField label='Tenant limit'>
            <Input type='number' min={0} {...getFieldProps('featureList.tenantLimit')} />
          </FormField>
          <FormField label='Team size limit'>
            <Input type='number' min={0} {...getFieldProps('featureList.teamSizeLimit')} />
          </FormField>
          <FormField label='Storage limit (GB)'>
            <Input
              type='number'
              min={0}
              step={0.5}
              {...getFieldProps('featureList.storageLimit')}
            />
          </FormField>
          <FormField label='e-Sign limit (per month)'>
            <Input type='number' min={0} {...getFieldProps('featureList.eSignDocsLimit')} />
          </FormField>
          <FormField label='AI messages limit (per month)'>
            <Input type='number' min={0} {...getFieldProps('featureList.aiInvocationLimit')} />
          </FormField>
          <FormField label='Custom templates limit'>
            <Input type='number' min={0} {...getFieldProps('featureList.customTemplatesLimit')} />
          </FormField>
        </SimpleGrid>
      </AppCard>

      <AppCard title='Priority support' description='Priority support for your customer.'>
        <SimpleGrid cols={3}>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <span className='text-sm font-medium'>Priority support</span>
            <Switch
              checked={fl.prioritySupport}
              onCheckedChange={(v) => setFieldValue('featureList.prioritySupport', v)}
            />
          </div>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <span className='text-sm font-medium'>Deposit protection</span>
            <Switch
              checked={fl.depositProtection}
              onCheckedChange={(v) => setFieldValue('featureList.depositProtection', v)}
            />
          </div>
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <span className='text-sm font-medium'>Advanced reporting</span>
            <Switch
              checked={fl.advancedReporting}
              onCheckedChange={(v) => setFieldValue('featureList.advancedReporting', v)}
            />
          </div>
        </SimpleGrid>
      </AppCard>
    </div>
  )
}
