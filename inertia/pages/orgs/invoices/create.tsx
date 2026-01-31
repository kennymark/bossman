import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, useForm } from '@inertiajs/react'
import { FileText, Minus, Plus } from 'lucide-react'
import type { RawOrg } from '#types/model-types'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const CURRENCY_OPTIONS = [
  { value: 'gbp', label: 'GBP' },
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
] as const

export type InvoiceLineItemRow = {
  id: string
  description: string
  amount: string
  currency: string
}

interface OrgInvoicesCreateProps extends SharedProps {
  org: RawOrg
  activeLeasesCount: number
}

let lineItemId = 0
const defaultLineItem = (): InvoiceLineItemRow => ({
  id: `line-${++lineItemId}`,
  description: '',
  amount: '',
  currency: 'gbp',
})

export default function OrgInvoicesCreate({ org, activeLeasesCount }: OrgInvoicesCreateProps) {
  const cleanName = String(org.cleanName ?? org.companyName ?? org.name ?? 'Organisation')
  const orgId = String(org.id ?? '')

  const { data, setData, post, processing, errors } = useForm({
    description: '',
    lineItems: [defaultLineItem()] as InvoiceLineItemRow[],
  })

  const addLineItem = () => {
    setData('lineItems', [...data.lineItems, defaultLineItem()])
  }

  const removeLineItem = (index: number) => {
    if (data.lineItems.length <= 1) return
    setData(
      'lineItems',
      data.lineItems.filter((_, i) => i !== index)
    )
  }

  const updateLineItem = (index: number, field: keyof InvoiceLineItemRow, value: string) => {
    const next = [...data.lineItems]
    next[index] = { ...next[index], [field]: value }
    setData('lineItems', next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/orgs/${orgId}/invoices`, { preserveScroll: true })
  }

  const formError = typeof errors.error === 'string' ? errors.error : errors.description

  return (
    <DashboardLayout>
      <Head title={`Create invoice – ${cleanName}`} />
      <div className='space-y-6'>
        <PageHeader
          backHref={`/orgs/${orgId}?tab=invoices`}
          title='Create invoice'
          description={`Create a draft invoice for ${cleanName} with optional line items. You can add more line items later or finalize in Stripe.`}
        />

        <Card className='w-fit'>
          <CardContent className='flex items-center gap-3 py-4'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
              <FileText className='h-5 w-5 text-muted-foreground' />
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Active leases</p>
              <p className='text-2xl font-semibold tabular-nums'>{activeLeasesCount}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <AppCard
            title='Memo (optional)'
            description='Internal note for the invoice.'
          >
            <FormField label='Memo' htmlFor='description' error={formError}>
              <Textarea
                id='description'
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                placeholder='Internal note or memo for the invoice'
                rows={2}
              />
            </FormField>
          </AppCard>

          <AppCard
            title='Line items'
            description='Add one or more line items. Amount is in the selected currency (e.g. 10.50 for £10.50).'
          >
            <div className='space-y-4'>
              {data.lineItems.map((row, index) => (
                <div
                  key={row.id}
                  className={cn(
                    'grid gap-4 rounded-lg border p-4',
                    'grid-cols-1 sm:grid-cols-[1fr_120px_100px_auto]'
                  )}
                >
                  <FormField label='Description' htmlFor={`lineItems.${index}.description`}>
                    <Input
                      id={`lineItems.${index}.description`}
                      value={row.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder='e.g. Monthly subscription'
                    />
                  </FormField>
                  <FormField label='Amount' htmlFor={`lineItems.${index}.amount`}>
                    <Input
                      id={`lineItems.${index}.amount`}
                      type='number'
                      step='0.01'
                      min='0'
                      value={row.amount}
                      onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                      placeholder='0.00'
                    />
                  </FormField>
                  <FormField label='Currency' htmlFor={`lineItems.${index}.currency`}>
                    <select
                      id={`lineItems.${index}.currency`}
                      value={row.currency}
                      onChange={(e) => updateLineItem(index, 'currency', e.target.value)}
                      className='border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {CURRENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <div className='flex items-end pb-2'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeLineItem(index)}
                      disabled={data.lineItems.length <= 1}
                      aria-label='Remove line item'
                    >
                      <Minus className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type='button' variant='outline' size='sm' onClick={addLineItem}>
                <Plus className='mr-2 h-4 w-4' />
                Add line item
              </Button>
            </div>
          </AppCard>

          <div className='flex gap-2'>
            <Button type='submit' disabled={processing}>
              {processing ? 'Creating…' : 'Create draft invoice'}
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
