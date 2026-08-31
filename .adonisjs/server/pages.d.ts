import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'account-deletion-result': ExtractProps<(typeof import('../../inertia/pages/account-deletion-result.tsx'))['default']>
    'addons/create': ExtractProps<(typeof import('../../inertia/pages/addons/create.tsx'))['default']>
    'addons/edit': ExtractProps<(typeof import('../../inertia/pages/addons/edit.tsx'))['default']>
    'addons/index': ExtractProps<(typeof import('../../inertia/pages/addons/index.tsx'))['default']>
    'analytics/index': ExtractProps<(typeof import('../../inertia/pages/analytics/index.tsx'))['default']>
    'api-access/index': ExtractProps<(typeof import('../../inertia/pages/api-access/index.tsx'))['default']>
    'audits/index': ExtractProps<(typeof import('../../inertia/pages/audits/index.tsx'))['default']>
    'blog/index': ExtractProps<(typeof import('../../inertia/pages/blog/index.tsx'))['default']>
    'blog/manage/categories': ExtractProps<(typeof import('../../inertia/pages/blog/manage/categories.tsx'))['default']>
    'blog/manage/create': ExtractProps<(typeof import('../../inertia/pages/blog/manage/create.tsx'))['default']>
    'blog/manage/edit': ExtractProps<(typeof import('../../inertia/pages/blog/manage/edit.tsx'))['default']>
    'blog/manage/index': ExtractProps<(typeof import('../../inertia/pages/blog/manage/index.tsx'))['default']>
    'blog/show': ExtractProps<(typeof import('../../inertia/pages/blog/show.tsx'))['default']>
    'dashboard/components/team-invitations': ExtractProps<(typeof import('../../inertia/pages/dashboard/components/team-invitations.tsx'))['default']>
    'dashboard/index': ExtractProps<(typeof import('../../inertia/pages/dashboard/index.tsx'))['default']>
    'db-backups/components/backup-health': ExtractProps<(typeof import('../../inertia/pages/db-backups/components/backup-health.tsx'))['default']>
    'db-backups/components/restore-dialog': ExtractProps<(typeof import('../../inertia/pages/db-backups/components/restore-dialog.tsx'))['default']>
    'db-backups/index': ExtractProps<(typeof import('../../inertia/pages/db-backups/index.tsx'))['default']>
    'emails/index': ExtractProps<(typeof import('../../inertia/pages/emails/index.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'forgot-password': ExtractProps<(typeof import('../../inertia/pages/forgot-password.tsx'))['default']>
    'leases/components/activity-tab': ExtractProps<(typeof import('../../inertia/pages/leases/components/activity-tab.tsx'))['default']>
    'leases/components/payments-tab': ExtractProps<(typeof import('../../inertia/pages/leases/components/payments-tab.tsx'))['default']>
    'leases/index': ExtractProps<(typeof import('../../inertia/pages/leases/index.tsx'))['default']>
    'leases/show': ExtractProps<(typeof import('../../inertia/pages/leases/show.tsx'))['default']>
    'login': ExtractProps<(typeof import('../../inertia/pages/login.tsx'))['default']>
    'logs/components/logs-filters': ExtractProps<(typeof import('../../inertia/pages/logs/components/logs-filters.tsx'))['default']>
    'logs/index': ExtractProps<(typeof import('../../inertia/pages/logs/index.tsx'))['default']>
    'orgs/components/activities-tab': ExtractProps<(typeof import('../../inertia/pages/orgs/components/activities-tab.tsx'))['default']>
    'orgs/components/create-customer-step-one': ExtractProps<(typeof import('../../inertia/pages/orgs/components/create-customer-step-one.tsx'))['default']>
    'orgs/components/create-customer-step-two': ExtractProps<(typeof import('../../inertia/pages/orgs/components/create-customer-step-two.tsx'))['default']>
    'orgs/components/create-customer-summary': ExtractProps<(typeof import('../../inertia/pages/orgs/components/create-customer-summary.tsx'))['default']>
    'orgs/components/invoices-tab': ExtractProps<(typeof import('../../inertia/pages/orgs/components/invoices-tab.tsx'))['default']>
    'orgs/components/leases-tab': ExtractProps<(typeof import('../../inertia/pages/orgs/components/leases-tab.tsx'))['default']>
    'orgs/components/page-options': ExtractProps<(typeof import('../../inertia/pages/orgs/components/page-options.tsx'))['default']>
    'orgs/components/properties-tab': ExtractProps<(typeof import('../../inertia/pages/orgs/components/properties-tab.tsx'))['default']>
    'orgs/create-form': ExtractProps<(typeof import('../../inertia/pages/orgs/create-form.ts'))['default']>
    'orgs/create': ExtractProps<(typeof import('../../inertia/pages/orgs/create.tsx'))['default']>
    'orgs/data': ExtractProps<(typeof import('../../inertia/pages/orgs/data.ts'))['default']>
    'orgs/edit': ExtractProps<(typeof import('../../inertia/pages/orgs/edit.tsx'))['default']>
    'orgs/index': ExtractProps<(typeof import('../../inertia/pages/orgs/index.tsx'))['default']>
    'orgs/invoices/create': ExtractProps<(typeof import('../../inertia/pages/orgs/invoices/create.tsx'))['default']>
    'orgs/invoices/line-items/create': ExtractProps<(typeof import('../../inertia/pages/orgs/invoices/line-items/create.tsx'))['default']>
    'orgs/show': ExtractProps<(typeof import('../../inertia/pages/orgs/show.tsx'))['default']>
    'properties/components/activity-tab': ExtractProps<(typeof import('../../inertia/pages/properties/components/activity-tab.tsx'))['default']>
    'properties/components/leases-tab': ExtractProps<(typeof import('../../inertia/pages/properties/components/leases-tab.tsx'))['default']>
    'properties/index': ExtractProps<(typeof import('../../inertia/pages/properties/index.tsx'))['default']>
    'properties/show': ExtractProps<(typeof import('../../inertia/pages/properties/show.tsx'))['default']>
    'push-notifications/create': ExtractProps<(typeof import('../../inertia/pages/push-notifications/create.tsx'))['default']>
    'push-notifications/index': ExtractProps<(typeof import('../../inertia/pages/push-notifications/index.tsx'))['default']>
    'reset-password': ExtractProps<(typeof import('../../inertia/pages/reset-password.tsx'))['default']>
    'servers/components/build-logs-sheet': ExtractProps<(typeof import('../../inertia/pages/servers/components/build-logs-sheet.tsx'))['default']>
    'servers/components/deployments-sheet': ExtractProps<(typeof import('../../inertia/pages/servers/components/deployments-sheet.tsx'))['default']>
    'servers/components/runtime-logs-sheet': ExtractProps<(typeof import('../../inertia/pages/servers/components/runtime-logs-sheet.tsx'))['default']>
    'servers/index': ExtractProps<(typeof import('../../inertia/pages/servers/index.tsx'))['default']>
    'servers/project-show': ExtractProps<(typeof import('../../inertia/pages/servers/project-show.tsx'))['default']>
    'settings/components/delete-account': ExtractProps<(typeof import('../../inertia/pages/settings/components/delete-account.tsx'))['default']>
    'settings/components/email_verification_card': ExtractProps<(typeof import('../../inertia/pages/settings/components/email_verification_card.tsx'))['default']>
    'settings/components/two-factor-auth': ExtractProps<(typeof import('../../inertia/pages/settings/components/two-factor-auth.tsx'))['default']>
    'settings/index': ExtractProps<(typeof import('../../inertia/pages/settings/index.tsx'))['default']>
    'settings/notifications-tab': ExtractProps<(typeof import('../../inertia/pages/settings/notifications-tab.tsx'))['default']>
    'settings/password-tab': ExtractProps<(typeof import('../../inertia/pages/settings/password-tab.tsx'))['default']>
    'settings/profile-tab': ExtractProps<(typeof import('../../inertia/pages/settings/profile-tab.tsx'))['default']>
    'settings/sessions-tab': ExtractProps<(typeof import('../../inertia/pages/settings/sessions-tab.tsx'))['default']>
    'teams/index': ExtractProps<(typeof import('../../inertia/pages/teams/index.tsx'))['default']>
    'teams/join': ExtractProps<(typeof import('../../inertia/pages/teams/join.tsx'))['default']>
    'teams/member-show': ExtractProps<(typeof import('../../inertia/pages/teams/member-show.tsx'))['default']>
    'verify-email-change': ExtractProps<(typeof import('../../inertia/pages/verify-email-change.tsx'))['default']>
    'verify-email': ExtractProps<(typeof import('../../inertia/pages/verify-email.tsx'))['default']>
  }
}
