/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'server-stats.api': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/server-stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.config': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/config'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.diagnostics': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/diagnostics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.queries': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/queries'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.events': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.routes': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/routes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.queryExplain': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/queries/:id/explain'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.logs': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.emails': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/emails'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.emailPreview': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/emails/:id/preview'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.traces': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/traces'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'server-stats.debug.traceDetail': {
    methods: ["GET","HEAD"]
    pattern: '/admin/api/debug/traces/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: unknown
    }
  }
  'drive.fs.serve': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/*'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'api_access.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/api-access/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/api_access_controller').default['stats']>>>
    }
  }
  'analytics.orgs_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/orgs/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['orgsStats']>>>
    }
  }
  'analytics.orgs_entities': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/orgs/entities'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsEntitiesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['orgsEntities']>>>
    }
  }
  'analytics.users_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/users/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['usersStats']>>>
    }
  }
  'analytics.users_entities': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/users/entities'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsEntitiesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['usersEntities']>>>
    }
  }
  'analytics.leases_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/leases/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['leasesStats']>>>
    }
  }
  'analytics.leases_entities': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/leases/entities'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsEntitiesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['leasesEntities']>>>
    }
  }
  'analytics.maintenance_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/maintenance/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['maintenanceStats']>>>
    }
  }
  'analytics.maintenance_entities': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/maintenance/entities'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsEntitiesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['maintenanceEntities']>>>
    }
  }
  'analytics.activity_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/activity/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsRangeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['activityStats']>>>
    }
  }
  'analytics.activity_entities': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/activity/entities'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').analyticsEntitiesValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['activityEntities']>>>
    }
  }
  'dashboard.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['stats']>>>
    }
  }
  'dashboard.recent_activity': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/activity'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['recentActivity']>>>
    }
  }
  'leases.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/leases/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leases_controller').default['stats']>>>
    }
  }
  'leases.payments': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/leases/:id/payments'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leases_controller').default['payments']>>>
    }
  }
  'leases.activity': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/leases/:id/activity'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leases_controller').default['activity']>>>
    }
  }
  'leaseable_entities.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/leaseable-entities/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leaseable_entities_controller').default['stats']>>>
    }
  }
  'leaseable_entities.leases': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/leaseable-entities/:id/leases'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leaseable_entities_controller').default['leases']>>>
    }
  }
  'leaseable_entities.activity': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/leaseable-entities/:id/activity'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leaseable_entities_controller').default['activity']>>>
    }
  }
  'orgs.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['stats']>>>
    }
  }
  'orgs.store': {
    methods: ["POST"]
    pattern: '/api/v1/orgs'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/org').createCustomerUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/org').createCustomerUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['store']>>>
    }
  }
  'orgs.update': {
    methods: ["PUT"]
    pattern: '/api/v1/orgs/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/org').updateOrgValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/org').updateOrgValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['update']>>>
    }
  }
  'org_actions.ban_user': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/ban-user'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/org_action').banUserValidator)>>
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/org_action').banUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['banUser']>>>
    }
  }
  'org_actions.unban_user': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/unban-user'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['unbanUser']>>>
    }
  }
  'org_actions.make_favourite': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/make-favourite'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['makeFavourite']>>>
    }
  }
  'org_actions.undo_favourite': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/undo-favourite'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['undoFavourite']>>>
    }
  }
  'org_actions.make_test_account': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/make-test-account'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['makeTestAccount']>>>
    }
  }
  'org_actions.undo_test_account': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/undo-test-account'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['undoTestAccount']>>>
    }
  }
  'org_actions.toggle_sales_account': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/toggle-sales-account'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['toggleSalesAccount']>>>
    }
  }
  'org_actions.request_delete_custom_user': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/request-delete-custom-user'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['requestDeleteCustomUser']>>>
    }
  }
  'org_actions.bulk_preview': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/actions/bulk-preview'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/org_action').bulkPreviewValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/org_action').bulkPreviewValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['bulkPreview']>>>
    }
  }
  'org_actions.bulk_make_favourite': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/actions/bulk-make-favourite'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/org_action').bulkOrgIdsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/org_action').bulkOrgIdsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['bulkMakeFavourite']>>>
    }
  }
  'org_actions.bulk_undo_favourite': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/actions/bulk-undo-favourite'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/org_action').bulkOrgIdsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/org_action').bulkOrgIdsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['bulkUndoFavourite']>>>
    }
  }
  'org_actions.bulk_make_test_account': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/actions/bulk-make-test-account'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/org_action').bulkOrgIdsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/org_action').bulkOrgIdsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['bulkMakeTestAccount']>>>
    }
  }
  'org_actions.bulk_undo_test_account': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/actions/bulk-undo-test-account'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/org_action').bulkOrgIdsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/org_action').bulkOrgIdsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['bulkUndoTestAccount']>>>
    }
  }
  'org_actions.get_ban_status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:orgId/ban-status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_actions_controller').default['getBanStatus']>>>
    }
  }
  'orgs.leases': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:id/leases'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['leases']>>>
    }
  }
  'orgs.properties': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:id/properties'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['properties']>>>
    }
  }
  'orgs.activities': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:id/activities'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['activities']>>>
    }
  }
  'orgs.invoices': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:id/invoices'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['invoices']>>>
    }
  }
  'push_notifications.users': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/push-notifications/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').pushNotificationUsersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['users']>>>
    }
  }
  'api.db_backups.store': {
    methods: ["POST"]
    pattern: '/api/v1/db-backups'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/destructive').createBackupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/destructive').createBackupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/db_backups_controller').default['store']>>>
    }
  }
  'db_backups.health': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/db-backups/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/db_backups_controller').default['health']>>>
    }
  }
  'db_backups.restore_preview': {
    methods: ["POST"]
    pattern: '/api/v1/db-backups/:id/restore-preview'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/destructive').restorePreviewValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/destructive').restorePreviewValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/db_backups_controller').default['restorePreview']>>>
    }
  }
  'db_backups.restore': {
    methods: ["POST"]
    pattern: '/api/v1/db-backups/:id/restore'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/destructive').restoreBackupValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/destructive').restoreBackupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/db_backups_controller').default['restore']>>>
    }
  }
  'emails.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/emails'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').emailsListValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/emails_controller').default['index']>>>
    }
  }
  'emails.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/emails/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/emails_controller').default['show']>>>
    }
  }
  'railway.projects': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/railway/projects'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').railwayFreshValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['projects']>>>
    }
  }
  'railway.project': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/railway/projects/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['project']>>>
    }
  }
  'railway.deployments': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/railway/services/:serviceId/deployments'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { serviceId: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').railwayDeploymentsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['deployments']>>>
    }
  }
  'railway.deployment_logs': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/railway/deployments/:id/logs/runtime'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['deploymentLogs']>>>
    }
  }
  'railway.deployment_build_logs': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/railway/deployments/:id/logs/build'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['deploymentBuildLogs']>>>
    }
  }
  'railway.deployment_restart': {
    methods: ["POST"]
    pattern: '/api/v1/railway/deployments/:id/restart'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/query').railwayActionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/query').railwayActionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['deploymentRestart']>>>
    }
  }
  'railway.deployment_redeploy': {
    methods: ["POST"]
    pattern: '/api/v1/railway/deployments/:id/redeploy'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/query').railwayActionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/query').railwayActionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['deploymentRedeploy']>>>
    }
  }
  'railway.service_deploy': {
    methods: ["POST"]
    pattern: '/api/v1/railway/services/:serviceId/deploy'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/query').railwayServiceDeployValidator)>>
      paramsTuple: [ParamValue]
      params: { serviceId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/query').railwayServiceDeployValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['serviceDeploy']>>>
    }
  }
  'railway.refresh': {
    methods: ["POST"]
    pattern: '/api/v1/railway/refresh'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/railway_controller').default['refresh']>>>
    }
  }
  'search.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/search_controller').default['index']>>>
    }
  }
  'org_billing.plans': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/billing/plans'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_billing_controller').default['plans']>>>
    }
  }
  'org_billing.subscription': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:orgId/billing/subscription'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_billing_controller').default['subscription']>>>
    }
  }
  'org_billing.invoices': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:orgId/billing/invoices'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_billing_controller').default['invoices']>>>
    }
  }
  'org_billing.plan': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:orgId/billing/plan'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_billing_controller').default['plan']>>>
    }
  }
  'org_billing.feature_flags': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:orgId/feature-flags'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_billing_controller').default['featureFlags']>>>
    }
  }
  'org_billing.update_feature_flags': {
    methods: ["PUT"]
    pattern: '/api/v1/orgs/:orgId/feature-flags'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_billing_controller').default['updateFeatureFlags']>>>
    }
  }
  'org_billing.reset_feature_flags': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/feature-flags/reset'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/org_billing_controller').default['resetFeatureFlags']>>>
    }
  }
  'impersonation.targets': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/:orgId/impersonation-targets'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/impersonation_controller').default['targets']>>>
    }
  }
  'impersonation.create': {
    methods: ["POST"]
    pattern: '/api/v1/orgs/:orgId/actions/impersonate'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/impersonation_controller').default['create']>>>
    }
  }
  'orgs.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/orgs/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['export']>>>
    }
  }
  'leases.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/leases/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leases_controller').default['export']>>>
    }
  }
  'leaseable_entities.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/leaseable-entities/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leaseable_entities_controller').default['export']>>>
    }
  }
  'maintenance.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/maintenance/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/maintenance_controller').default['stats']>>>
    }
  }
  'maintenance.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/maintenance/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/maintenance_controller').default['export']>>>
    }
  }
  'maintenance.by_org': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/maintenance/by-org/:orgId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/maintenance_controller').default['byOrg']>>>
    }
  }
  'documents.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/documents/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['stats']>>>
    }
  }
  'documents.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/documents/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['export']>>>
    }
  }
  'documents.by_org': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/documents/by-org/:orgId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { orgId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['byOrg']>>>
    }
  }
  'jobs.status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/jobs/status'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['status']>>>
    }
  }
  'jobs.stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/jobs/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['stats']>>>
    }
  }
  'jobs.list': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/jobs/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['list']>>>
    }
  }
  'jobs.history': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/jobs/history'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['history']>>>
    }
  }
  'jobs.detail': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/jobs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['detail']>>>
    }
  }
  'jobs.rerun': {
    methods: ["POST"]
    pattern: '/api/v1/jobs/:id/rerun'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['rerun']>>>
    }
  }
  'jobs.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/jobs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['destroy']>>>
    }
  }
  'analytics.revenue_stats': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/analytics/revenue/stats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['revenueStats']>>>
    }
  }
  'dashboard.attention': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/dashboard/attention'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['attention']>>>
    }
  }
  'app_env.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/update-env'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app_env_controller').default['show']>>>
    }
  }
  'app_env.update': {
    methods: ["PUT"]
    pattern: '/api/v1/update-env'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/app_env').updateAppEnvValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/app_env').updateAppEnvValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app_env_controller').default['update']>>>
    }
  }
  'dashboard.index': {
    methods: ["GET","HEAD"]
    pattern: '/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/dashboard_controller').default['index']>>>
    }
  }
  'teams_page.index': {
    methods: ["GET","HEAD"]
    pattern: '/teams'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/teams_page_controller').default['index']>>>
    }
  }
  'teams_page.show': {
    methods: ["GET","HEAD"]
    pattern: '/teams/members/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/teams_page_controller').default['show']>>>
    }
  }
  'leases.index': {
    methods: ["GET","HEAD"]
    pattern: '/leases'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leases_controller').default['index']>>>
    }
  }
  'leases.show': {
    methods: ["GET","HEAD"]
    pattern: '/leases/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leases_controller').default['show']>>>
    }
  }
  'leaseable_entities.index': {
    methods: ["GET","HEAD"]
    pattern: '/properties'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leaseable_entities_controller').default['index']>>>
    }
  }
  'leaseable_entities.show': {
    methods: ["GET","HEAD"]
    pattern: '/properties/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/leaseable_entities_controller').default['show']>>>
    }
  }
  'orgs.index': {
    methods: ["GET","HEAD"]
    pattern: '/orgs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['index']>>>
    }
  }
  'orgs.create': {
    methods: ["GET","HEAD"]
    pattern: '/orgs/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['create']>>>
    }
  }
  'orgs.edit': {
    methods: ["GET","HEAD"]
    pattern: '/orgs/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['edit']>>>
    }
  }
  'orgs.show': {
    methods: ["GET","HEAD"]
    pattern: '/orgs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['show']>>>
    }
  }
  'orgs.create_invoice': {
    methods: ["GET","HEAD"]
    pattern: '/orgs/:id/invoices/create'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['createInvoice']>>>
    }
  }
  'orgs.store_invoice': {
    methods: ["POST"]
    pattern: '/orgs/:id/invoices'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['storeInvoice']>>>
    }
  }
  'orgs.create_invoice_line_item': {
    methods: ["GET","HEAD"]
    pattern: '/orgs/:id/invoices/:invoiceId/line-items/create'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; invoiceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['createInvoiceLineItem']>>>
    }
  }
  'orgs.store_invoice_line_item': {
    methods: ["POST"]
    pattern: '/orgs/:id/invoices/:invoiceId/line-items'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; invoiceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orgs_controller').default['storeInvoiceLineItem']>>>
    }
  }
  'push_notifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/push-notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['index']>>>
    }
  }
  'push_notifications.create': {
    methods: ["GET","HEAD"]
    pattern: '/push-notifications/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['create']>>>
    }
  }
  'push_notifications.store': {
    methods: ["POST"]
    pattern: '/push-notifications'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/push_notification').storePushNotificationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/push_notification').storePushNotificationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['store']>>>
    }
  }
  'push_notifications.resend': {
    methods: ["POST"]
    pattern: '/push-notifications/:id/resend'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/push_notifications_controller').default['resend']>>>
    }
  }
  'analytics.index': {
    methods: ["GET","HEAD"]
    pattern: '/analytics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/analytics_controller').default['index']>>>
    }
  }
  'api_access.index': {
    methods: ["GET","HEAD"]
    pattern: '/api-access'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/api_access_controller').default['index']>>>
    }
  }
  'db_backups.index': {
    methods: ["GET","HEAD"]
    pattern: '/db-backups'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/db_backups_controller').default['index']>>>
    }
  }
  'db_backups.download': {
    methods: ["GET","HEAD"]
    pattern: '/db-backups/:id/download'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/db_backups_controller').default['download']>>>
    }
  }
  'logs_page.index': {
    methods: ["GET","HEAD"]
    pattern: '/logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/logs_page_controller').default['index']>>>
    }
  }
  'servers.index': {
    methods: ["GET","HEAD"]
    pattern: '/servers'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/servers_controller').default['index']>>>
    }
  }
  'servers.show': {
    methods: ["GET","HEAD"]
    pattern: '/servers/:projectId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { projectId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/servers_controller').default['show']>>>
    }
  }
  'addons.index': {
    methods: ["GET","HEAD"]
    pattern: '/addons'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/addons_controller').default['index']>>>
    }
  }
  'addons.create': {
    methods: ["GET","HEAD"]
    pattern: '/addons/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/addons_controller').default['create']>>>
    }
  }
  'addons.store': {
    methods: ["POST"]
    pattern: '/addons'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/addon').createAddonValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/addon').createAddonValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/addons_controller').default['store']>>>
    }
  }
  'addons.edit': {
    methods: ["GET","HEAD"]
    pattern: '/addons/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/addons_controller').default['edit']>>>
    }
  }
  'addons.update': {
    methods: ["PUT"]
    pattern: '/addons/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/addon').updateAddonValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/addon').updateAddonValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/addons_controller').default['update']>>>
    }
  }
  'emails_page.index': {
    methods: ["GET","HEAD"]
    pattern: '/emails'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/emails_page_controller').default['index']>>>
    }
  }
  'emails_page.show': {
    methods: ["GET","HEAD"]
    pattern: '/emails/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/emails_page_controller').default['show']>>>
    }
  }
  'db_backups.store': {
    methods: ["POST"]
    pattern: '/db-backups'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/destructive').createBackupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/destructive').createBackupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/db_backups_controller').default['store']>>>
    }
  }
  'db_backups.destroy': {
    methods: ["DELETE"]
    pattern: '/db-backups/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/destructive').deleteBackupValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/destructive').deleteBackupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/db_backups_controller').default['destroy']>>>
    }
  }
  'audits.page': {
    methods: ["GET","HEAD"]
    pattern: '/audits'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audits_controller').default['page']>>>
    }
  }
  'maintenance.index': {
    methods: ["GET","HEAD"]
    pattern: '/maintenance'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/maintenance_controller').default['index']>>>
    }
  }
  'maintenance.show': {
    methods: ["GET","HEAD"]
    pattern: '/maintenance/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/maintenance_controller').default['show']>>>
    }
  }
  'documents.index': {
    methods: ["GET","HEAD"]
    pattern: '/documents'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['index']>>>
    }
  }
  'jobs.index': {
    methods: ["GET","HEAD"]
    pattern: '/jobs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['index']>>>
    }
  }
  'jobs.show': {
    methods: ["GET","HEAD"]
    pattern: '/jobs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/jobs_controller').default['show']>>>
    }
  }
  'blog_posts.admin_index': {
    methods: ["GET","HEAD"]
    pattern: '/blog/manage'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_posts_controller').default['adminIndex']>>>
    }
  }
  'blog_posts.create': {
    methods: ["GET","HEAD"]
    pattern: '/blog/manage/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_posts_controller').default['create']>>>
    }
  }
  'blog_posts.store': {
    methods: ["POST"]
    pattern: '/blog/manage'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/blog').createBlogPostValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/blog').createBlogPostValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_posts_controller').default['store']>>>
    }
  }
  'blog_posts.edit': {
    methods: ["GET","HEAD"]
    pattern: '/blog/manage/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_posts_controller').default['edit']>>>
    }
  }
  'blog_posts.update': {
    methods: ["PUT"]
    pattern: '/blog/manage/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/blog').updateBlogPostValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/blog').updateBlogPostValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_posts_controller').default['update']>>>
    }
  }
  'blog_posts.destroy': {
    methods: ["DELETE"]
    pattern: '/blog/manage/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_posts_controller').default['destroy']>>>
    }
  }
  'blog_categories.index': {
    methods: ["GET","HEAD"]
    pattern: '/blog/manage/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_categories_controller').default['index']>>>
    }
  }
  'blog_categories.store': {
    methods: ["POST"]
    pattern: '/blog/manage/categories'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/blog').createBlogCategoryValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/blog').createBlogCategoryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_categories_controller').default['store']>>>
    }
  }
  'blog_categories.destroy': {
    methods: ["DELETE"]
    pattern: '/blog/manage/categories/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_categories_controller').default['destroy']>>>
    }
  }
  'confirm_delete_custom_user.respond': {
    methods: ["GET","HEAD"]
    pattern: '/confirm-delete-custom-user'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/confirm_delete_custom_user_controller').default['respond']>>>
    }
  }
  'blog_posts.index': {
    methods: ["GET","HEAD"]
    pattern: '/blog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_posts_controller').default['index']>>>
    }
  }
  'blog_posts.show': {
    methods: ["GET","HEAD"]
    pattern: '/blog/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/blog_posts_controller').default['show']>>>
    }
  }
  'team_invitations.join_page': {
    methods: ["GET","HEAD"]
    pattern: '/join'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team_invitations_controller').default['joinPage']>>>
    }
  }
  'auth.logout': {
    methods: ["GET","HEAD"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/v1/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
    }
  }
  'auth.two_factor_challenge': {
    methods: ["POST"]
    pattern: '/api/v1/auth/2fa/challenge'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').twoFactorChallengeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').twoFactorChallengeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['twoFactorChallenge']>>>
    }
  }
  'auth.forgot_password': {
    methods: ["POST"]
    pattern: '/api/v1/auth/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['forgotPassword']>>>
    }
  }
  'auth.reset_password': {
    methods: ["POST"]
    pattern: '/api/v1/auth/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').resetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resetPassword']>>>
    }
  }
  'auth.verify_email': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/verify-email'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/auth').verifyEmailTokenValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verifyEmail']>>>
    }
  }
  'auth.verify_email_change': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/auth/verify-email-change'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/auth').verifyEmailTokenValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verifyEmailChange']>>>
    }
  }
  'auth.resend_verification_email': {
    methods: ["POST"]
    pattern: '/api/v1/auth/verify-email/resend'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resendVerificationEmail']>>>
    }
  }
  'users.update_profile': {
    methods: ["PUT"]
    pattern: '/api/v1/user/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['updateProfile']>>>
    }
  }
  'users.update_password': {
    methods: ["PUT"]
    pattern: '/api/v1/user/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updatePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updatePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['updatePassword']>>>
    }
  }
  'users.upload_avatar': {
    methods: ["POST"]
    pattern: '/api/v1/user/avatar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').uploadAvatarValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').uploadAvatarValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['uploadAvatar']>>>
    }
  }
  'users.delete_avatar': {
    methods: ["DELETE"]
    pattern: '/api/v1/user/avatar'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['deleteAvatar']>>>
    }
  }
  'sessions.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/user/sessions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['index']>>>
    }
  }
  'sessions.revoke': {
    methods: ["POST"]
    pattern: '/api/v1/user/sessions/revoke'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').revokeSessionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').revokeSessionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['revoke']>>>
    }
  }
  'sessions.revoke_all': {
    methods: ["POST"]
    pattern: '/api/v1/user/sessions/revoke-all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sessions_controller').default['revokeAll']>>>
    }
  }
  'users.delete_account': {
    methods: ["DELETE"]
    pattern: '/api/v1/user/account'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').passwordConfirmationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').passwordConfirmationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['deleteAccount']>>>
    }
  }
  'users.update_settings': {
    methods: ["PUT"]
    pattern: '/api/v1/user/settings'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateSettingsValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateSettingsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['updateSettings']>>>
    }
  }
  'users.get_settings': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/user/settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['getSettings']>>>
    }
  }
  'two_factor.status': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/user/2fa/status'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['status']>>>
    }
  }
  'two_factor.setup': {
    methods: ["POST"]
    pattern: '/api/v1/user/2fa/setup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['setup']>>>
    }
  }
  'two_factor.enable': {
    methods: ["POST"]
    pattern: '/api/v1/user/2fa/enable'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/auth').enableTwoFactorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/auth').enableTwoFactorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['enable']>>>
    }
  }
  'two_factor.disable': {
    methods: ["POST"]
    pattern: '/api/v1/user/2fa/disable'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').passwordConfirmationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').passwordConfirmationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['disable']>>>
    }
  }
  'two_factor.verify': {
    methods: ["POST"]
    pattern: '/api/v1/user/2fa/verify'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['verify']>>>
    }
  }
  'two_factor.regenerate_recovery_codes': {
    methods: ["POST"]
    pattern: '/api/v1/user/2fa/recovery-codes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').passwordConfirmationValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').passwordConfirmationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['regenerateRecoveryCodes']>>>
    }
  }
  'members.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/members'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['index']>>>
    }
  }
  'members.invitations': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/members/invitations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['invitations']>>>
    }
  }
  'members.data_access_options': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/members/data-access-options'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['dataAccessOptions']>>>
    }
  }
  'members.update_member': {
    methods: ["PUT"]
    pattern: '/api/v1/members/:memberId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/team').updateMemberValidator)>>
      paramsTuple: [ParamValue]
      params: { memberId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/team').updateMemberValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['updateMember']>>>
    }
  }
  'members.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/members/:memberId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { memberId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['destroy']>>>
    }
  }
  'team_invitations.invite': {
    methods: ["POST"]
    pattern: '/api/v1/invitations'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/team').inviteToTeamValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/team').inviteToTeamValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team_invitations_controller').default['invite']>>>
    }
  }
  'team_invitations.update_invitation': {
    methods: ["PUT"]
    pattern: '/api/v1/invitations/:invitationId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/team').updateInvitationValidator)>>
      paramsTuple: [ParamValue]
      params: { invitationId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/team').updateInvitationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team_invitations_controller').default['updateInvitation']>>>
    }
  }
  'team_invitations.destroy': {
    methods: ["DELETE"]
    pattern: '/api/v1/invitations/:invitationId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { invitationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team_invitations_controller').default['destroy']>>>
    }
  }
  'team_invitations.invite_link': {
    methods: ["POST"]
    pattern: '/api/v1/invitations/:invitationId/invite-link'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { invitationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team_invitations_controller').default['inviteLink']>>>
    }
  }
  'team_invitations.accept': {
    methods: ["POST"]
    pattern: '/api/v1/team-invitations/accept'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/team').acceptTeamInviteGuestValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/team').acceptTeamInviteGuestValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/team_invitations_controller').default['accept']>>>
    }
  }
  'notifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').paginationQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['index']>>>
    }
  }
  'notifications.mark_as_read': {
    methods: ["POST"]
    pattern: '/api/v1/notifications/mark-as-read'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/notification').markAsReadValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/notification').markAsReadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markAsRead']>>>
    }
  }
  'notifications.mark_all_as_read': {
    methods: ["POST"]
    pattern: '/api/v1/notifications/mark-all-as-read'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['markAllAsRead']>>>
    }
  }
  'notifications.unread_count': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/notifications/unread-count'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['unreadCount']>>>
    }
  }
  'notifications.delete': {
    methods: ["DELETE"]
    pattern: '/api/v1/notifications/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/notifications_controller').default['delete']>>>
    }
  }
  'audits.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/audits'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').auditsIndexValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audits_controller').default['index']>>>
    }
  }
  'audits.recent': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/audits/recent'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audits_controller').default['recent']>>>
    }
  }
  'audits.actions': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/audits/actions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/query').auditActionsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audits_controller').default['actions']>>>
    }
  }
  'audits.actors': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/audits/actors'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audits_controller').default['actors']>>>
    }
  }
  'audits.export': {
    methods: ["GET","HEAD"]
    pattern: '/api/v1/audits/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/audits_controller').default['export']>>>
    }
  }
  'health_checks': {
    methods: ["GET","HEAD"]
    pattern: '/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/health_checks_controller').default['handle']>>>
    }
  }
  'attachments': {
    methods: ["GET","HEAD"]
    pattern: '/attachments/:key/:name?'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { key: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('@jrmc/adonis-attachment/controllers/attachments_controller').default['handle']>>>
    }
  }
  'event_stream': {
    methods: ["GET","HEAD"]
    pattern: '/__transmit/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'subscribe': {
    methods: ["POST"]
    pattern: '/__transmit/subscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
  'unsubscribe': {
    methods: ["POST"]
    pattern: '/__transmit/unsubscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
    }
  }
}
