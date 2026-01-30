import type { FormikProps } from 'formik'
import { AppCard } from '@/components/ui/app-card'
import { FormField } from '@/components/ui/form_field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password_input'
import { RadioGroup } from '@/components/ui/radio-group'
import type { CreateCustomerFormValues } from '../create-form'

const accountTypeOptions = [
  {
    value: 'landlord',
    label: 'Landlord',
    description: 'A landlord is an individual or entity that owns a property.',
  },
  {
    value: 'agency',
    label: 'Agency',
    description: 'An agency manages properties on behalf of landlords.',
  },
]

interface CreateCustomerFormStepOneProps {
  formik: FormikProps<CreateCustomerFormValues>
}

export function CreateCustomerFormStepOne({ formik }: CreateCustomerFormStepOneProps) {
  const { values, handleChange, touched, errors } = formik

  return (
    <AppCard title='Details' description='Account type and basic information.'>
      <div className='pb-4'>
        <p className='text-sm font-medium mb-2'>Account type</p>
        <RadioGroup
          spacing={2}
          options={accountTypeOptions}
          orientation='horizontal'
          value={values.accountType}
          onChange={(value) => formik.setFieldValue('accountType', value)}
        />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <FormField label='Name' htmlFor='name' required error={touched.name && errors.name}>
          <Input
            id='name'
            name='name'
            value={values.name}
            onChange={handleChange}
            placeholder='Organisation name'
          />
        </FormField>

        <FormField label='Email' htmlFor='email' required error={touched.email && errors.email}>
          <Input
            id='email'
            name='email'
            type='email'
            value={values.email}
            onChange={handleChange}
            placeholder='email@example.com'
          />
        </FormField>

        <FormField
          label='Password'
          htmlFor='password'
          required
          error={touched.password && errors.password}>
          <PasswordInput
            id='password'
            name='password'
            value={values.password}
            onChange={handleChange}
            placeholder='••••••••'
          />
        </FormField>

        <FormField
          label='Phone number'
          htmlFor='contactNumber'
          required
          error={touched.contactNumber && errors.contactNumber}>
          <Input
            id='contactNumber'
            name='contactNumber'
            value={values.contactNumber}
            onChange={handleChange}
            placeholder='+44 ...'
          />
        </FormField>

        <FormField
          label='Address line one'
          htmlFor='addressLineOne'
          required
          error={touched.addressLineOne && errors.addressLineOne}
          className='md:col-span-2'>
          <Input
            id='addressLineOne'
            name='addressLineOne'
            value={values.addressLineOne}
            onChange={handleChange}
            placeholder='Street address'
          />
        </FormField>

        <FormField label='Address line two' htmlFor='addressLineTwo'>
          <Input
            id='addressLineTwo'
            name='addressLineTwo'
            value={values.addressLineTwo}
            onChange={handleChange}
            placeholder='Apartment, suite, etc. (optional)'
          />
        </FormField>

        <FormField label='City' htmlFor='city' required error={touched.city && errors.city}>
          <Input
            id='city'
            name='city'
            value={values.city}
            onChange={handleChange}
            placeholder='City'
          />
        </FormField>

        <FormField
          label='Postal code'
          htmlFor='postCode'
          required
          error={touched.postCode && errors.postCode}>
          <Input
            id='postCode'
            name='postCode'
            value={values.postCode}
            onChange={handleChange}
            placeholder='Post code'
          />
        </FormField>

        <FormField
          label='Country'
          htmlFor='country'
          required
          error={touched.country && errors.country}>
          <Input
            id='country'
            name='country'
            value={values.country}
            onChange={handleChange}
            placeholder='e.g. United Kingdom'
          />
        </FormField>
      </div>
    </AppCard>
  )
}
