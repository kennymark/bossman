import type { FormikProps } from 'formik'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CreateCustomerFormValues } from '../create-form'

interface CreateCustomerSummaryProps {
  formik: FormikProps<CreateCustomerFormValues>
}

export function CreateCustomerSummary({ formik }: CreateCustomerSummaryProps) {
  const { values } = formik
  const ps = values.customPaymentSchedule

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>Review and create the customer.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className='grid gap-4 sm:grid-cols-2'>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Type</dt>
            <dd className='capitalize'>{values.accountType}</dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Name</dt>
            <dd>{values.name || '—'}</dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Email</dt>
            <dd>{values.email || '—'}</dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Contact number</dt>
            <dd>{values.contactNumber || '—'}</dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Country</dt>
            <dd>{values.country || '—'}</dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Address</dt>
            <dd>
              {[values.addressLineOne, values.addressLineTwo, values.city, values.postCode]
                .filter(Boolean)
                .join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Plan</dt>
            <dd className='capitalize'>{ps.plan}</dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Frequency</dt>
            <dd className='capitalize'>{ps.frequency}</dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Currency / Amount</dt>
            <dd>
              {ps.currency.toUpperCase()} {ps.amount}
            </dd>
          </div>
          <div>
            <dt className='text-sm font-medium text-muted-foreground'>Payment method</dt>
            <dd>{ps.paymentMethod === 'bank_transfer' ? 'Bank transfer' : 'Stripe'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
