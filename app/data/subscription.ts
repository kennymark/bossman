const standard = {
  automatedEmail: true,
  tenantLimit: 4,
  storageLimit: 50,
  activityLogRetention: 30,
  eLease: true,
  teamSizeLimit: 1,
  eSignDocsLimit: 10,
  aiInvocationLimit: 50, // 50 per month
  customTemplatesLimit: 0,
  propertyLimit: 100,
}

export const plansFeatureList = {
  free_trial: standard,
  standard: standard,

  essential: {
    tenantLimit: 12,
    storageLimit: 200,
    togethaAI: true,
    activityLogRetention: 90,
    marketing: true,
    teamSizeLimit: 3,
    eSignDocsLimit: 20,
    aiInvocationLimit: 200, // 200 per month
    customTemplatesLimit: 10,
    propertyLimit: 100,
  },

  premium: {
    tenantLimit: 24,
    teamSizeLimit: 10,
    storageLimit: 1_240,
    prioritySupport: true,
    activityLogRetention: 365,
    depositProtection: true,
    advancedReporting: true,
    eSignDocsLimit: 100,
    aiInvocationLimit: 500, // 500 per month
    customTemplatesLimit: 50,
  },
}

export const stripePricingIds = {
  standard: {
    dev: {
      monthly: 'price_1NpFdvHhNEQ5MjrcoaGF19td',
      yearly: 'price_1NpFdvHhNEQ5Mjrc9ibCtZ0o',
    },
    prod: {
      monthly: 'price_1NpFAPHhNEQ5MjrcNrkaUWKy',
      yearly: 'price_1NpFAPHhNEQ5MjrcPk3nb4er',
      // Legacy price ID for existing subscriptions
      // monthly_legacy: 'price_1NpFAPHhNEQ5MjrcNrkaUWKy',
    },
  },

  essential: {
    dev: {
      monthly: 'price_1NpFgsHhNEQ5MjrcZgo2bsf2',
      yearly: 'price_1NpFgsHhNEQ5MjrcNB0POdGH',
    },

    prod: {
      monthly: 'price_1NpFFMHhNEQ5MjrcEfggWqDI',
      yearly: 'price_1NpFFMHhNEQ5MjrcSMPwGg5h',
    },
  },

  premium: {
    dev: {
      monthly: 'price_1NpFifHhNEQ5Mjrc35QUMoLx',
      yearly: 'price_1NpFifHhNEQ5Mjrcibd28OgE',
    },

    prod: {
      monthly: 'price_1NpFGiHhNEQ5MjrchlfFEgcy',
      yearly: 'price_1NpFGtHhNEQ5MjrcPnfAzUMO',
    },
  },
}

//write a function that takes in the pricing id and the env(dev or prod)  and returns the name of the plan =  Standard Monthly
type Env = 'dev' | 'prod'
type Billing = 'monthly' | 'yearly'
type BillingWithLegacy = Billing | 'monthly_legacy'

export function getPlanName(
  priceId: string,
  env: Env,
): { plan: string; frequency: Billing; fullName: string } | null {
  for (const [plan, envs] of Object.entries(stripePricingIds)) {
    const billing = Object.entries(envs[env]).find(([, id]) => id === priceId) as
      | [BillingWithLegacy, string]
      | undefined

    if (billing) {
      const [billingCycle] = billing
      // Handle legacy price IDs by mapping them to standard monthly
      const frequency = billingCycle === 'monthly_legacy' ? 'monthly' : (billingCycle as Billing)
      return {
        plan: plan,
        frequency: frequency,
        fullName: `${plan}_${frequency}`,
      }
    }
  }
  return null
}

export function getTrialPeriod(subscription: any) {
  const { trial_start, trial_end } = subscription

  if (!trial_start || !trial_end) {
    return null // no trial active
  }

  return {
    startedAt: new Date(trial_start * 1000), // Stripe uses Unix timestamps
    endsAt: new Date(trial_end * 1000),
    isExpired: Date.now() > trial_end * 1000,
    isActive: Date.now() < trial_end * 1000,
  }
}
function calcPricingPlan(monthlyPrice: number, discountPercentage = 20): PriceResult {
  // Calculate the yearly price without discount
  const yearly = monthlyPrice * 12
  // Calculate the discount amount
  const discountAmount = (yearly * discountPercentage) / 100
  // Subtract the discount from the yearly price
  const discountedYearlyPrice = yearly - discountAmount
  return {
    monthly: monthlyPrice,
    yearly: discountedYearlyPrice,
  }
}

export const pricingFeatures = {
  standard: {
    ...calcPricingPlan(20),
    features: [
      'Automated emails',
      'Unlimited properties',
      'Up to 4 tenancies',
      'Up to 1 team member',
      '50mb storage',
      'E-Lease and e-sign',
      '30 day activity log',
      'Email support',
    ],
  },
  essential: {
    ...calcPricingPlan(50),
    features: [
      'Everything in standard',
      'Up to 12 tenancies',
      'Up to 3 team members',
      '200mb storage',
      'Improved support',
      'Togetha AI (Upcoming)',
      'E-sign leases (20 documents)',
      '3 months activity log',
      'Marketing on Rightmove/Zoopla (upcoming)',
    ],
  },
  premium: {
    ...calcPricingPlan(100),
    features: [
      'Everything in essential',
      'Up to 24 tenancies',
      'Add up to 10 team members',
      '10gb storage',
      'Priority support',
      '1 year activity log',
      'E-sign leases (50 documents)',
      'Deposit protection (upcoming)',
      'Advanced reports (upcoming)',
    ],
  },
  custom: {
    ...calcPricingPlan(200),
    features: [
      'Everything in premium',
      'Custom tenant limit',
      'Custom team member limit',
      'Custom storage limit',
      'Custom integrations',
      'Custom reports',
      'Custom everything',
    ],
  },
}

type PriceResult = { monthly: number; yearly: number }
export type PlanFeatures = typeof standard
