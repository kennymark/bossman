import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, router } from '@inertiajs/react'
import type { FormikErrors } from 'formik'
import { useFormik } from 'formik'
import { IdCard, Scroll, Users } from 'lucide-react'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { PageHeader } from '@/components/dashboard/page_header'
import { createStepperSteps, Stepper } from '@/components/ui/stepper'
import { CreateCustomerFormStepOne } from './components/create-customer-step-one'
import { CreateCustomerFormStepTwo } from './components/create-customer-step-two'
import { CreateCustomerSummary } from './components/create-customer-summary'
import {
  type CreateCustomerFormValues,
  createCustomerInitialValues,
  createCustomerValidationSchema,
} from './create-form'

interface OrgsCreateProps extends SharedProps { }

export default function OrgsCreate(props: OrgsCreateProps) {
  const formik = useFormik<CreateCustomerFormValues>({
    initialValues: createCustomerInitialValues,
    validationSchema: createCustomerValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit(values) {
      console.log(values)
      // router.post('/orgs', values as unknown as Parameters<typeof router.post>[1], {
      //   preserveScroll: true,
      //   forceFormData: false,
      // })
    },
  })

  console.log(formik.errors)

  const errors = props.errors as Record<string, string> | undefined
  useEffect(() => {
    if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
      formik.setErrors(errors as FormikErrors<CreateCustomerFormValues>)
    }
  }, [])

  const steps = createStepperSteps([
    {
      label: 'Details',
      icon: Users,
      id: 'details',
      content: <CreateCustomerFormStepOne formik={formik} />,
    },
    {
      label: 'Plan & Features',
      icon: IdCard,
      id: 'plan',
      content: <CreateCustomerFormStepTwo formik={formik} />,
    },
    {
      label: 'Summary',
      icon: Scroll,
      id: 'summary',
      content: <CreateCustomerSummary formik={formik} />,
      nextText: 'Create',
      onNextClick() {
        formik.handleSubmit()
      },
    },
  ])

  return (
    <DashboardLayout>
      <Head title='New customer' />
      <div className='space-y-6'>
        <PageHeader
          backHref='/orgs'
          title='Create a new plan for your landlords and agencies'
          description='Set up a new customer in a few steps.'
        />

        <Stepper steps={steps} />
      </div>
    </DashboardLayout>
  )
}
