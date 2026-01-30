import * as Yup from 'yup'

/** Form shape matching createCustomerUserValidator (app/validators/org.ts) */
export interface CreateCustomerFormValues {
  name: string
  email: string
  password: string
  accountType: 'landlord' | 'agency'
  country: string
  contactNumber: string
  addressLineOne: string
  addressLineTwo: string
  city: string
  postCode: string
  sortCode: string
  accountNumber: string
  isWhiteLabelEnabled: boolean

  customPaymentSchedule: {
    amount: number
    trialPeriodInDays: number
    frequency: 'monthly' | 'quarterly' | 'yearly'
    currency: 'gbp' | 'eur' | 'usd'
    promoCode: string
    paymentMethod: 'stripe' | 'bank_transfer'
    plan: 'standard' | 'essential' | 'premium'
    planType: 'normal' | 'custom'
  }

  pages: {
    orgPages: Array<{
      label: string
      isEnabled: boolean
      isRequired?: boolean
      children?: string[]
    }>
  }

  languagePreferences: {
    tenants: 'tenants' | 'residents' | 'tenants/residents'
    properties: 'properties' | 'units' | 'homes' | 'houses'
    tenancies: 'tenancies' | 'leases' | 'contracts'
  }

  featureList: {
    propertyLimit: number
    tenantLimit: number
    storageLimit: number
    teamSizeLimit: number
    prioritySupport: boolean
    activityLogRetention: number
    depositProtection: boolean
    advancedReporting: boolean
    eSignDocsLimit: number
    aiInvocationLimit: number
    customTemplatesLimit: number
  }

  metadata?: Record<string, unknown>
}

const defaultOrgPages: CreateCustomerFormValues['pages']['orgPages'] = [
  { label: 'Dashboard', isEnabled: true },
  { label: 'Teams', isEnabled: true },
  {
    label: 'Manage',
    isEnabled: true,
    children: ['Properties', 'Tenancies', 'Maintenance'],
  },
  {
    label: 'Finance',
    isEnabled: true,
    children: ['Invoices', 'Payments', 'Payouts'],
  },
  {
    label: 'Settings',
    isEnabled: true,
    children: ['Profile', 'Preferences'],
  },
]

export const createCustomerInitialValues: CreateCustomerFormValues = {
  name: '',
  email: '',
  password: '',
  accountType: 'landlord',
  country: 'United Kingdom',
  contactNumber: '',
  addressLineOne: '',
  addressLineTwo: '',
  city: '',
  postCode: '',
  sortCode: '',
  accountNumber: '',
  isWhiteLabelEnabled: false,

  customPaymentSchedule: {
    amount: 5,
    trialPeriodInDays: 0,
    frequency: 'monthly',
    currency: 'gbp',
    promoCode: '',
    paymentMethod: 'bank_transfer',
    plan: 'standard',
    planType: 'normal',
  },

  pages: { orgPages: defaultOrgPages },

  languagePreferences: {
    tenants: 'tenants',
    properties: 'properties',
    tenancies: 'tenancies',
  },

  featureList: {
    propertyLimit: 20,
    tenantLimit: 4,
    storageLimit: 0.02,
    teamSizeLimit: 1,
    prioritySupport: false,
    activityLogRetention: 90,
    depositProtection: false,
    advancedReporting: false,
    eSignDocsLimit: 10,
    aiInvocationLimit: 50,
    customTemplatesLimit: 0,
  },

  metadata: {},
}

const orgPageSchema = Yup.object({
  label: Yup.string().required(),
  isEnabled: Yup.boolean().required(),
  isRequired: Yup.boolean().optional(),
  children: Yup.array().of(Yup.string()).optional().nullable(),
})

export const createCustomerValidationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
  accountType: Yup.mixed<'landlord' | 'agency'>()
    .oneOf(['landlord', 'agency'], 'Invalid account type')
    .required('Account type is required'),
  country: Yup.string().required('Country is required'),
  contactNumber: Yup.string().required('Contact number is required'),
  addressLineOne: Yup.string().required('Address line one is required'),
  addressLineTwo: Yup.string().optional(),
  city: Yup.string().required('City is required'),
  postCode: Yup.string().required('Post code is required'),
  sortCode: Yup.string().optional(),
  accountNumber: Yup.string().optional(),
  isWhiteLabelEnabled: Yup.boolean().required(),

  customPaymentSchedule: Yup.object({
    amount: Yup.number().required().min(0),
    trialPeriodInDays: Yup.number().required().min(0),
    frequency: Yup.mixed<'monthly' | 'quarterly' | 'yearly'>()
      .oneOf(['monthly', 'quarterly', 'yearly'])
      .required(),
    currency: Yup.mixed<'gbp' | 'eur' | 'usd'>().oneOf(['gbp', 'eur', 'usd']).required(),
    promoCode: Yup.string().optional(),
    paymentMethod: Yup.mixed<'stripe' | 'bank_transfer'>()
      .oneOf(['stripe', 'bank_transfer'])
      .required(),
    plan: Yup.mixed<'standard' | 'essential' | 'premium'>()
      .oneOf(['standard', 'essential', 'premium'])
      .required(),
  }).required(),

  pages: Yup.object({
    orgPages: Yup.array().of(orgPageSchema).required(),
  }).required(),

  languagePreferences: Yup.object({
    tenants: Yup.mixed<'tenants' | 'residents' | 'tenants/residents'>()
      .oneOf(['tenants', 'residents', 'tenants/residents'])
      .required(),
    properties: Yup.mixed<'properties' | 'units' | 'homes' | 'houses'>()
      .oneOf(['properties', 'units', 'homes', 'houses'])
      .required(),
    tenancies: Yup.mixed<'tenancies' | 'leases' | 'contracts'>()
      .oneOf(['tenancies', 'leases', 'contracts'])
      .required(),
  }).required(),

  featureList: Yup.object({
    propertyLimit: Yup.number().required().min(0),
    tenantLimit: Yup.number().required().min(0),
    storageLimit: Yup.number().required().min(0),
    teamSizeLimit: Yup.number().required().min(0),
    prioritySupport: Yup.boolean().required(),
    activityLogRetention: Yup.number().required().min(0),
    depositProtection: Yup.boolean().required(),
    advancedReporting: Yup.boolean().required(),
    eSignDocsLimit: Yup.number().required().min(0),
    aiInvocationLimit: Yup.number().required().min(0),
    customTemplatesLimit: Yup.number().required().min(0),
  }).required(),

  metadata: Yup.object().optional(),
})
