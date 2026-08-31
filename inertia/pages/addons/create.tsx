import type { SharedProps } from '@adonisjs/inertia/types'
import { Link, useForm } from '@inertiajs/react'

import { startCase } from '#utils/functions'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface AddonsCreateProps extends SharedProps {}

const BILLING_OPTIONS = [
  { value: 'one_off', label: 'One-off' },
  { value: 'recurring_monthly', label: 'Recurring (monthly)' },
  { value: 'recurring_yearly', label: 'Recurring (yearly)' },
  // { value: 'usage', label: 'Usage-based' },
] as const

export default function AddonsCreate(_props: AddonsCreateProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    shortDescription: '',
    longDescription: '',
    priceAmount: '',
    priceCurrency: 'GBP',
    billingType: 'one_off' as const,
    features: [] as string[],
    isActive: true,
    sortOrder: 0,
  })

  const addFeature = () => {
    setData('features', [...data.features, ''])
  }

  const setFeature = (index: number, value: string) => {
    const next = [...data.features]
    next[index] = value
    setData('features', next)
  }

  const removeFeature = (index: number) => {
    setData(
      'features',
      data.features.filter((_, i) => i !== index),
    )
  }

  return (
    <DashboardPage
      title='New addon'
      description='Create an addon and set its price on this page.'
      backHref='/addons'>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          post('/addons', { preserveScroll: true })
        }}
        className='space-y-6'>
        <AppCard
          title='Details'
          description='Name and descriptions. Slug is generated automatically from the name.'>
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField label='Name' htmlFor='name' required error={errors.name}>
              <Input
                id='name'
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder='e.g. Extra storage'
                required
              />
            </FormField>

            <FormField
              label='Short description'
              htmlFor='shortDescription'
              error={errors.shortDescription}>
              <Input
                id='shortDescription'
                value={data.shortDescription}
                onChange={(e) => setData('shortDescription', e.target.value)}
                placeholder='Brief description'
              />
            </FormField>

            <FormField
              label='Long description'
              htmlFor='longDescription'
              error={errors.longDescription}
              className='md:col-span-2'>
              <Textarea
                id='longDescription'
                value={data.longDescription}
                onChange={(e) => setData('longDescription', e.target.value)}
                rows={3}
                placeholder='Full description (optional)'
              />
            </FormField>
          </div>
        </AppCard>

        <AppCard title='Price' description='Set the price for this addon on the same page.'>
          <div className='grid gap-4 md:grid-cols-3'>
            <FormField
              label='Billing type'
              htmlFor='billingType'
              required
              error={errors.billingType}>
              <Select
                itemToStringLabel={(item) => startCase(item)}
                value={data.billingType}
                onValueChange={(v) => setData('billingType', v as typeof data.billingType)}>
                <SelectTrigger id='billingType'>
                  <SelectValue placeholder='Select billing type' />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label='Price amount' htmlFor='priceAmount' error={errors.priceAmount}>
              <Input
                id='priceAmount'
                type='text'
                inputMode='decimal'
                value={data.priceAmount}
                onChange={(e) => setData('priceAmount', e.target.value)}
                placeholder='e.g. 9.99'
              />
            </FormField>

            <FormField label='Currency' htmlFor='priceCurrency' error={errors.priceCurrency}>
              <Select
                value={data.priceCurrency}
                onValueChange={(v) => setData('priceCurrency', v as typeof data.priceCurrency)}>
                <SelectTrigger id='priceCurrency'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='GBP'>GBP</SelectItem>
                  <SelectItem value='USD'>USD</SelectItem>
                  <SelectItem value='EUR'>EUR</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </AppCard>

        <AppCard title='Options' description='Features list and display options.'>
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField label='Sort order' htmlFor='sortOrder' error={errors.sortOrder}>
              <Input
                id='sortOrder'
                type='number'
                min={0}
                value={data.sortOrder}
                onChange={(e) => setData('sortOrder', parseInt(e.target.value, 10) || 0)}
              />
            </FormField>

            <div className='flex items-center gap-2'>
              <Checkbox
                id='isActive'
                checked={data.isActive}
                onCheckedChange={(v) => setData('isActive', v === true)}
              />
              <Label htmlFor='isActive'>Active</Label>
            </div>

            <div className='md:col-span-2 space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>Features</Label>
                <Button type='button' variant='outline' size='sm' onClick={addFeature}>
                  Add feature
                </Button>
              </div>
              {data.features.length > 0 ? (
                <ul className='space-y-2'>
                  {data.features.map((feature, i) => (
                    <li key={`feature-${i}-${feature.slice(0, 8)}`} className='flex gap-2'>
                      <Input
                        value={feature}
                        onChange={(e) => setFeature(i, e.target.value)}
                        placeholder='Feature description'
                        className='flex-1'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => removeFeature(i)}>
                        ×
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </AppCard>

        <div className='flex gap-2'>
          <Button
            type='submit'
            disabled={processing}
            isLoading={processing}
            loadingText='Creating…'>
            Create addon
          </Button>
          <Button type='button' variant='outline' asChild>
            <Link href='/addons'>Cancel</Link>
          </Button>
        </div>
      </form>
    </DashboardPage>
  )
}
