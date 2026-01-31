import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, useForm } from '@inertiajs/react'
import type { RawOrg } from '#types/model-types'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'

const CURRENCY_OPTIONS = [
  { value: 'gbp', label: 'GBP' },
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
] as const

interface OrgInvoiceLineItemCreateProps extends SharedProps {
  org: RawOrg
  invoiceId: string
}

export default function OrgInvoiceLineItemCreate({
  org,
  invoiceId,
}: OrgInvoiceLineItemCreateProps) {
  const cleanName = String(org.cleanName ?? org.companyName ?? org.name ?? 'Organisation')
  const orgId = String(org.id ?? '')

  const { data, setData, post, processing, errors } = useForm({
    description: '',
    amount: '',
    currency: 'gbp',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/orgs/${orgId}/invoices/${invoiceId}/line-items`, { preserveScroll: true })
  }

  const formError = typeof errors.error === 'string' ? errors.error : errors.description

  return (
    <DashboardLayout>
      <Head title={`Add line item – ${cleanName}`} />
      <div className='space-y-6'>
        <PageHeader
          backHref={`/orgs/${orgId}?tab=invoices`}
          title='Add line item'
          description={`Add a line item to this draft invoice for ${cleanName}. Amount is in the selected currency (e.g. 10.50 for £10.50).`}
        />

        <form onSubmit={handleSubmit} className='space-y-6'>
          <AppCard title='Line item' description='Description, amount and currency for this line.'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                label='Description'
                htmlFor='description'
                required
                error={formError || errors.description}
              >
                <Input
                  id='description'
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder='e.g. Monthly subscription'
                  required
                />
              </FormField>
              <FormField
                label='Amount'
                htmlFor='amount'
                required
                error={errors.amount}
              >
                <Input
                  id='amount'
                  type='number'
                  step='0.01'
                  min='0'
                  value={data.amount}
                  onChange={(e) => setData('amount', e.target.value)}
                  placeholder='0.00'
                  required
                />
              </FormField>
              <FormField label='Currency' htmlFor='currency'>
                <select
                  id='currency'
                  value={data.currency}
                  onChange={(e) => setData('currency', e.target.value)}
                  className='border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </AppCard>

          <div className='flex gap-2'>
            <Button type='submit' disabled={processing}>
              {processing ? 'Adding…' : 'Add line item'}
            </Button>
            <Button type='button' variant='outline' asChild>
              <a href={`/orgs/${orgId}?tab=invoices`}>Cancel</a>
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
