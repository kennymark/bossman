import router from '@adonisjs/core/services/router'

import { middleware } from '#start/kernel'

import { apiThrottle } from '../limiter.js'

const AnalyticsController = () => import('#controllers/analytics_controller')
const AppEnvController = () => import('#controllers/app_env_controller')
const ApiAccessController = () => import('#controllers/api_access_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const DbBackupsController = () => import('#controllers/db_backups_controller')
const DocumentsController = () => import('#controllers/documents_controller')
const ImpersonationController = () => import('#controllers/impersonation_controller')
const JobsController = () => import('#controllers/jobs_controller')
const MaintenanceController = () => import('#controllers/maintenance_controller')
const OrgBillingController = () => import('#controllers/org_billing_controller')
const SearchController = () => import('#controllers/search_controller')
const EmailsController = () => import('#controllers/emails_controller')
const LeasesController = () => import('#controllers/leases_controller')
const LeaseableEntitiesController = () => import('#controllers/leaseable_entities_controller')
const OrgActionsController = () => import('#controllers/org_actions_controller')
const OrgsController = () => import('#controllers/orgs_controller')
const PushNotificationsController = () => import('#controllers/push_notifications_controller')
const RailwayController = () => import('#controllers/railway_controller')

router
  .group(() => {
    router.get('/api-access/stats', [ApiAccessController, 'stats'])
    router.get('/analytics/orgs/stats', [AnalyticsController, 'orgsStats'])
    router.get('/analytics/orgs/entities', [AnalyticsController, 'orgsEntities'])
    router.get('/analytics/users/stats', [AnalyticsController, 'usersStats'])
    router.get('/analytics/users/entities', [AnalyticsController, 'usersEntities'])
    router.get('/analytics/leases/stats', [AnalyticsController, 'leasesStats'])
    router.get('/analytics/leases/entities', [AnalyticsController, 'leasesEntities'])
    router.get('/analytics/maintenance/stats', [AnalyticsController, 'maintenanceStats'])
    router.get('/analytics/maintenance/entities', [AnalyticsController, 'maintenanceEntities'])
    router.get('/analytics/activity/stats', [AnalyticsController, 'activityStats'])
    router.get('/analytics/activity/entities', [AnalyticsController, 'activityEntities'])
    router.get('/dashboard/stats', [DashboardController, 'stats'])
    router.get('/dashboard/activity', [DashboardController, 'recentActivity'])
    router.get('/leases/stats', [LeasesController, 'stats'])
    router.get('/leases/:id/payments', [LeasesController, 'payments'])
    router.get('/leases/:id/activity', [LeasesController, 'activity'])
    router.get('/leaseable-entities/stats', [LeaseableEntitiesController, 'stats'])
    router.get('/leaseable-entities/:id/leases', [LeaseableEntitiesController, 'leases'])
    router.get('/leaseable-entities/:id/activity', [LeaseableEntitiesController, 'activity'])
    router.get('/orgs/stats', [OrgsController, 'stats'])
    router.post('/orgs', [OrgsController, 'store'])
    router.put('/orgs/:id', [OrgsController, 'update'])
    router.post('/orgs/:orgId/actions/ban-user', [OrgActionsController, 'banUser'])
    router.post('/orgs/:orgId/actions/unban-user', [OrgActionsController, 'unbanUser'])
    router.post('/orgs/:orgId/actions/make-favourite', [OrgActionsController, 'makeFavourite'])
    router.post('/orgs/:orgId/actions/undo-favourite', [OrgActionsController, 'undoFavourite'])
    router.post('/orgs/:orgId/actions/make-test-account', [OrgActionsController, 'makeTestAccount'])
    router.post('/orgs/:orgId/actions/undo-test-account', [OrgActionsController, 'undoTestAccount'])
    router.post('/orgs/:orgId/actions/toggle-sales-account', [
      OrgActionsController,
      'toggleSalesAccount',
    ])
    router.post('/orgs/:orgId/actions/request-delete-custom-user', [
      OrgActionsController,
      'requestDeleteCustomUser',
    ])
    /** Dry run first: shows exactly which orgs a bulk action would touch. */
    router.post('/orgs/actions/bulk-preview', [OrgActionsController, 'bulkPreview'])
    router.post('/orgs/actions/bulk-make-favourite', [OrgActionsController, 'bulkMakeFavourite'])
    router.post('/orgs/actions/bulk-undo-favourite', [OrgActionsController, 'bulkUndoFavourite'])
    router.post('/orgs/actions/bulk-make-test-account', [
      OrgActionsController,
      'bulkMakeTestAccount',
    ])
    router.post('/orgs/actions/bulk-undo-test-account', [
      OrgActionsController,
      'bulkUndoTestAccount',
    ])
    router.get('/orgs/:orgId/ban-status', [OrgActionsController, 'getBanStatus'])

    router.get('/orgs/:id/leases', [OrgsController, 'leases'])
    router.get('/orgs/:id/properties', [OrgsController, 'properties'])
    router.get('/orgs/:id/activities', [OrgsController, 'activities'])
    router.get('/orgs/:id/invoices', [OrgsController, 'invoices'])

    router.get('/push-notifications/users', [PushNotificationsController, 'users'])
    router.post('/db-backups', [DbBackupsController, 'store']).as('api.db_backups.store')
    router.get('/db-backups/health', [DbBackupsController, 'health'])
    /** Dry run: reports what a restore would do without running it. */
    router.post('/db-backups/:id/restore-preview', [DbBackupsController, 'restorePreview'])
    router.post('/db-backups/:id/restore', [DbBackupsController, 'restore'])

    router.get('/emails', [EmailsController, 'index'])
    router.get('/emails/:id', [EmailsController, 'show'])

    router.get('/railway/projects', [RailwayController, 'projects'])
    router.get('/railway/projects/:id', [RailwayController, 'project'])
    router.get('/railway/services/:serviceId/deployments', [RailwayController, 'deployments'])
    router.get('/railway/deployments/:id/logs/runtime', [RailwayController, 'deploymentLogs'])
    router.get('/railway/deployments/:id/logs/build', [RailwayController, 'deploymentBuildLogs'])
    router.post('/railway/deployments/:id/restart', [RailwayController, 'deploymentRestart'])
    router.post('/railway/deployments/:id/redeploy', [RailwayController, 'deploymentRedeploy'])
    router.post('/railway/services/:serviceId/deploy', [RailwayController, 'serviceDeploy'])
    /** Drops the cached Railway reads; the next page load goes back to the API. */
    router.post('/railway/refresh', [RailwayController, 'refresh'])

    /** Record search behind the command palette; results are filtered by page grant. */
    router.get('/search', [SearchController, 'index'])

    router.get('/billing/plans', [OrgBillingController, 'plans'])
    router.get('/orgs/:orgId/billing/subscription', [OrgBillingController, 'subscription'])
    router.get('/orgs/:orgId/billing/invoices', [OrgBillingController, 'invoices'])
    router.get('/orgs/:orgId/billing/plan', [OrgBillingController, 'plan'])
    router.get('/orgs/:orgId/feature-flags', [OrgBillingController, 'featureFlags'])
    router.put('/orgs/:orgId/feature-flags', [OrgBillingController, 'updateFeatureFlags'])
    router.post('/orgs/:orgId/feature-flags/reset', [OrgBillingController, 'resetFeatureFlags'])

    router.get('/orgs/:orgId/impersonation-targets', [ImpersonationController, 'targets'])
    router.post('/orgs/:orgId/actions/impersonate', [ImpersonationController, 'create'])

    router.get('/orgs/export', [OrgsController, 'export'])
    router.get('/leases/export', [LeasesController, 'export'])
    router.get('/leaseable-entities/export', [LeaseableEntitiesController, 'export'])

    router.get('/maintenance/stats', [MaintenanceController, 'stats'])
    router.get('/maintenance/export', [MaintenanceController, 'export'])
    router.get('/maintenance/by-org/:orgId', [MaintenanceController, 'byOrg'])

    router.get('/documents/stats', [DocumentsController, 'stats'])
    router.get('/documents/export', [DocumentsController, 'export'])
    router.get('/documents/by-org/:orgId', [DocumentsController, 'byOrg'])

    router.get('/jobs/status', [JobsController, 'status'])
    router.get('/jobs/stats', [JobsController, 'stats'])
    router.get('/jobs/list', [JobsController, 'list'])
    router.get('/jobs/history', [JobsController, 'history'])
    router.get('/jobs/:id', [JobsController, 'detail'])
    router.post('/jobs/:id/rerun', [JobsController, 'rerun'])
    router.delete('/jobs/:id', [JobsController, 'destroy'])

    router.get('/analytics/revenue/stats', [AnalyticsController, 'revenueStats'])
    router.get('/dashboard/attention', [DashboardController, 'attention'])

    router.get('update-env', [AppEnvController, 'show']).as('app_env.show')
    router.put('update-env', [AppEnvController, 'update']).as('app_env.update')
  })
  .prefix('api/v1')
  /**
   * Same gate as the pages these endpoints back. Previously this group was guarded by
   * `auth()` alone, so any signed-in user could call endpoints for pages they had no
   * grant for — including creating and restoring database backups.
   *
   * `apiThrottle` was defined but never applied, leaving every endpoint here —
   * analytics, org mutations, backup creation, Railway redeploys — unmetered.
   */
  .use([apiThrottle, middleware.auth(), middleware.appRole(), middleware.pageAccess()])
