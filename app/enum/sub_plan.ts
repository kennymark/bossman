export enum SubPlans {
  standard_monthly = 1,
  standard_yearly = 2,
  essential_monthly = 3,
  essential_yearly = 4,
  premium_monthly = 5,
  premium_yearly = 6,
}

const SubPlansReversed = new Map()
SubPlansReversed.set(1, 'standard_monthly')
SubPlansReversed.set(2, 'standard_yearly')
SubPlansReversed.set(3, 'essential_monthly')
SubPlansReversed.set(4, 'essential_yearly')
SubPlansReversed.set(5, 'premium_monthly')
SubPlansReversed.set(6, 'premium_yearly')

export default SubPlansReversed
