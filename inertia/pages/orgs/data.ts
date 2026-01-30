const pageTree = [
  { label: 'Dashboard', isEnabled: true, isRequired: true },
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
    isRequired: true,
    isEnabled: true,
    children: ['Profile', 'Preferences'],
  },
]

export default pageTree
