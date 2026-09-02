import type { SharedProps } from '@adonisjs/inertia/types'
import { router } from '@inertiajs/react'
import { IconClipboardCheck, IconId, IconUsers } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useFormik } from 'formik'
import { toast } from 'sonner'

import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { LoadingOverlay } from '@/components/ui'
import { createStepperSteps, Stepper } from '@/components/ui/stepper'
import { type ServerErrorResponse, serverErrorResponder } from '@/lib/error'
import api from '@/lib/http'

import { CreateCustomerFormStepOne } from './components/create-customer-step-one'
import { CreateCustomerFormStepTwo } from './components/create-customer-step-two'
import { CreateCustomerSummary } from './components/create-customer-summary'
import {
  type CreateCustomerFormValues,
  createCustomerInitialValues,
  createCustomerValidationSchema,
} from './create-form'

interface OrgsCreateProps extends SharedProps {}

export default function OrgsCreate(props: OrgsCreateProps) {
  const formik = useFormik<CreateCustomerFormValues>({
    initialValues: createCustomerInitialValues,
    validationSchema: createCustomerValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit(values) {
      console.log(values)
      createOrgMutation(values)
    },
  })

  console.log('errors', formik.errors)

  const { mutate: createOrgMutation, isPending } = useMutation({
    mutationFn: (values: CreateCustomerFormValues) => api.orgs.store({ body: values }),
    onSuccess: () => {
      toast.success('Customer created successfully')
      router.visit('/orgs')
    },
    onError: (error: ServerErrorResponse) => {
      toast.error(serverErrorResponder(error) || 'Failed to create customer')
    },
  })

  const steps = createStepperSteps([
    {
      label: 'Details',
      icon: IconUsers,
      id: 'details',
      content: <CreateCustomerFormStepOne formik={formik} />,
    },
    {
      label: 'Plan & Features',
      icon: IconId,
      id: 'plan',
      content: <CreateCustomerFormStepTwo formik={formik} />,
    },
    {
      label: 'Summary',
      icon: IconClipboardCheck,
      id: 'summary',
      content: <CreateCustomerSummary formik={formik} />,
      nextText: 'Create',
      nextBtnDisabled: isPending,

      onNextClick() {
        formik.handleSubmit()
      },
    },
  ])

  return (
    <DashboardPage
      title='Create a new plan for your landlords and agencies'
      description='Set up a new customer in a few steps.'
      backHref='/orgs'>
      <LoadingOverlay isLoading={isPending} text='Creating customer...' />
      <Stepper steps={steps} />
    </DashboardPage>
  )
}
