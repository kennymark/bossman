import router from '@adonisjs/core/services/router'
import vine from '@vinejs/vine'

import { middleware } from '#start/kernel'

const AnalyticsController = () => import('#controllers/analytics_controller')
const ApiAccessController = () => import('#controllers/api_access_controller')
const DashboardController = () => import('#controllers/dashboard_controller')
const DbBackupsController = () => import('#controllers/db_backups_controller')
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

    router.get('update-env', ({ session, response }) => {
      const appEnv = (session.get('appEnv') as 'dev' | 'prod' | undefined) ?? 'dev'
      return response.ok({ appEnv })
    })
    router.put('update-env', async ({ request, session, response, auth }) => {
      const updateEnvValidator = vine.create(
        vine.object({
          appEnv: vine.enum(['dev', 'prod'] as const),
        }),
      )
      const { appEnv: requestedEnv } = await request.validateUsing(updateEnvValidator)
      const user = auth.getUserOrFail()
      // Prod-only users (invited with prod access) cannot switch; keep them on prod
      const isProdOnly = user.enableProdAccess && !user.isGodAdmin
      const appEnv = isProdOnly ? ('prod' as const) : requestedEnv
      session.put('appEnv', appEnv)
      return response.ok({ message: 'Environment updated successfully', appEnv })
    })
  })
  .prefix('api/v1')
  .use(middleware.auth())
