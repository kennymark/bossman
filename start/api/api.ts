import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const DashboardController = () => import('#controllers/dashboard_controller')
const LeasesController = () => import('#controllers/leases_controller')
const LeaseableEntitiesController = () => import('#controllers/leaseable_entities_controller')
const OrgsController = () => import('#controllers/orgs_controller')
const PushNotificationsController = () => import('#controllers/push_notifications_controller')

router
  .group(() => {
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
    router.get('/orgs/:id/leases', [OrgsController, 'leases'])
    router.get('/orgs/:id/properties', [OrgsController, 'properties'])
    router.get('/orgs/:id/activities', [OrgsController, 'activities'])
    router.get('/orgs/:id/invoices', [OrgsController, 'invoices'])
    router.get('/push-notifications/users', [PushNotificationsController, 'users'])
  })
  .prefix('api/v1')
  .use(middleware.auth())
