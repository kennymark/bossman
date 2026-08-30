/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  serverStats: {
    api: typeof routes['server-stats.api']
    debug: {
      config: typeof routes['server-stats.debug.config']
      diagnostics: typeof routes['server-stats.debug.diagnostics']
      queries: typeof routes['server-stats.debug.queries']
      events: typeof routes['server-stats.debug.events']
      routes: typeof routes['server-stats.debug.routes']
      queryExplain: typeof routes['server-stats.debug.queryExplain']
      logs: typeof routes['server-stats.debug.logs']
      emails: typeof routes['server-stats.debug.emails']
      emailPreview: typeof routes['server-stats.debug.emailPreview']
      traces: typeof routes['server-stats.debug.traces']
      traceDetail: typeof routes['server-stats.debug.traceDetail']
    }
    dashboard: typeof routes['server-stats.dashboard']
    overview: typeof routes['server-stats.overview'] & {
      chart: typeof routes['server-stats.overview.chart']
    }
    requests: typeof routes['server-stats.requests'] & {
      show: typeof routes['server-stats.requests.show']
    }
    queries: typeof routes['server-stats.queries'] & {
      grouped: typeof routes['server-stats.queries.grouped']
      explain: typeof routes['server-stats.queries.explain']
    }
    events: typeof routes['server-stats.events']
    routes: typeof routes['server-stats.routes']
    logs: typeof routes['server-stats.logs']
    emails: typeof routes['server-stats.emails'] & {
      preview: typeof routes['server-stats.emails.preview']
    }
    traces: typeof routes['server-stats.traces'] & {
      show: typeof routes['server-stats.traces.show']
    }
    cache: typeof routes['server-stats.cache'] & {
      show: typeof routes['server-stats.cache.show']
      delete: typeof routes['server-stats.cache.delete']
    }
    jobs: typeof routes['server-stats.jobs'] & {
      show: typeof routes['server-stats.jobs.show']
      retry: typeof routes['server-stats.jobs.retry']
    }
    config: typeof routes['server-stats.config']
    filters: typeof routes['server-stats.filters'] & {
      create: typeof routes['server-stats.filters.create']
      delete: typeof routes['server-stats.filters.delete']
    }
  }
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  analytics: {
    orgsStats: typeof routes['analytics.orgs_stats']
    orgsEntities: typeof routes['analytics.orgs_entities']
    usersStats: typeof routes['analytics.users_stats']
    usersEntities: typeof routes['analytics.users_entities']
    leasesStats: typeof routes['analytics.leases_stats']
    leasesEntities: typeof routes['analytics.leases_entities']
    maintenanceStats: typeof routes['analytics.maintenance_stats']
    maintenanceEntities: typeof routes['analytics.maintenance_entities']
    activityStats: typeof routes['analytics.activity_stats']
    activityEntities: typeof routes['analytics.activity_entities']
    index: typeof routes['analytics.index']
  }
  dashboard: {
    stats: typeof routes['dashboard.stats']
    recentActivity: typeof routes['dashboard.recent_activity']
    index: typeof routes['dashboard.index']
  }
  leases: {
    stats: typeof routes['leases.stats']
    payments: typeof routes['leases.payments']
    activity: typeof routes['leases.activity']
    index: typeof routes['leases.index']
    show: typeof routes['leases.show']
  }
  leaseableEntities: {
    stats: typeof routes['leaseable_entities.stats']
    leases: typeof routes['leaseable_entities.leases']
    activity: typeof routes['leaseable_entities.activity']
    index: typeof routes['leaseable_entities.index']
    show: typeof routes['leaseable_entities.show']
  }
  orgs: {
    stats: typeof routes['orgs.stats']
    store: typeof routes['orgs.store']
    update: typeof routes['orgs.update']
    leases: typeof routes['orgs.leases']
    properties: typeof routes['orgs.properties']
    activities: typeof routes['orgs.activities']
    invoices: typeof routes['orgs.invoices']
    index: typeof routes['orgs.index']
    create: typeof routes['orgs.create']
    edit: typeof routes['orgs.edit']
    show: typeof routes['orgs.show']
    createInvoice: typeof routes['orgs.create_invoice']
    storeInvoice: typeof routes['orgs.store_invoice']
    createInvoiceLineItem: typeof routes['orgs.create_invoice_line_item']
    storeInvoiceLineItem: typeof routes['orgs.store_invoice_line_item']
  }
  orgActions: {
    banUser: typeof routes['org_actions.ban_user']
    unbanUser: typeof routes['org_actions.unban_user']
    makeFavourite: typeof routes['org_actions.make_favourite']
    undoFavourite: typeof routes['org_actions.undo_favourite']
    makeTestAccount: typeof routes['org_actions.make_test_account']
    undoTestAccount: typeof routes['org_actions.undo_test_account']
    toggleSalesAccount: typeof routes['org_actions.toggle_sales_account']
    requestDeleteCustomUser: typeof routes['org_actions.request_delete_custom_user']
    bulkMakeFavourite: typeof routes['org_actions.bulk_make_favourite']
    bulkUndoFavourite: typeof routes['org_actions.bulk_undo_favourite']
    bulkMakeTestAccount: typeof routes['org_actions.bulk_make_test_account']
    bulkUndoTestAccount: typeof routes['org_actions.bulk_undo_test_account']
    getBanStatus: typeof routes['org_actions.get_ban_status']
  }
  pushNotifications: {
    users: typeof routes['push_notifications.users']
    index: typeof routes['push_notifications.index']
    create: typeof routes['push_notifications.create']
    store: typeof routes['push_notifications.store']
    resend: typeof routes['push_notifications.resend']
  }
  api: {
    dbBackups: {
      store: typeof routes['api.db_backups.store']
    }
  }
  dbBackups: {
    restore: typeof routes['db_backups.restore']
    index: typeof routes['db_backups.index']
    download: typeof routes['db_backups.download']
    store: typeof routes['db_backups.store']
    destroy: typeof routes['db_backups.destroy']
  }
  emails: {
    index: typeof routes['emails.index']
    show: typeof routes['emails.show']
  }
  railway: {
    projects: typeof routes['railway.projects']
    project: typeof routes['railway.project']
    deployments: typeof routes['railway.deployments']
    deploymentLogs: typeof routes['railway.deployment_logs']
    deploymentBuildLogs: typeof routes['railway.deployment_build_logs']
    deploymentRestart: typeof routes['railway.deployment_restart']
    deploymentRedeploy: typeof routes['railway.deployment_redeploy']
    serviceDeploy: typeof routes['railway.service_deploy']
  }
  teamsPage: {
    index: typeof routes['teams_page.index']
    show: typeof routes['teams_page.show']
  }
  logsPage: {
    index: typeof routes['logs_page.index']
  }
  servers: {
    index: typeof routes['servers.index']
    show: typeof routes['servers.show']
  }
  addons: {
    index: typeof routes['addons.index']
    create: typeof routes['addons.create']
    store: typeof routes['addons.store']
    edit: typeof routes['addons.edit']
    update: typeof routes['addons.update']
  }
  emailsPage: {
    index: typeof routes['emails_page.index']
    show: typeof routes['emails_page.show']
  }
  blogPosts: {
    adminIndex: typeof routes['blog_posts.admin_index']
    create: typeof routes['blog_posts.create']
    store: typeof routes['blog_posts.store']
    edit: typeof routes['blog_posts.edit']
    update: typeof routes['blog_posts.update']
    destroy: typeof routes['blog_posts.destroy']
    index: typeof routes['blog_posts.index']
    show: typeof routes['blog_posts.show']
  }
  blogCategories: {
    index: typeof routes['blog_categories.index']
    store: typeof routes['blog_categories.store']
    destroy: typeof routes['blog_categories.destroy']
  }
  confirmDeleteCustomUser: {
    respond: typeof routes['confirm_delete_custom_user.respond']
  }
  teamInvitations: {
    joinPage: typeof routes['team_invitations.join_page']
    invite: typeof routes['team_invitations.invite']
    updateInvitation: typeof routes['team_invitations.update_invitation']
    destroy: typeof routes['team_invitations.destroy']
    inviteLink: typeof routes['team_invitations.invite_link']
    accept: typeof routes['team_invitations.accept']
  }
  auth: {
    logout: typeof routes['auth.logout']
    login: typeof routes['auth.login']
    forgotPassword: typeof routes['auth.forgot_password']
    resetPassword: typeof routes['auth.reset_password']
    verifyEmail: typeof routes['auth.verify_email']
    verifyEmailChange: typeof routes['auth.verify_email_change']
    resendVerificationEmail: typeof routes['auth.resend_verification_email']
  }
  users: {
    updateProfile: typeof routes['users.update_profile']
    updatePassword: typeof routes['users.update_password']
    uploadAvatar: typeof routes['users.upload_avatar']
    deleteAvatar: typeof routes['users.delete_avatar']
    deleteAccount: typeof routes['users.delete_account']
    updateSettings: typeof routes['users.update_settings']
    getSettings: typeof routes['users.get_settings']
  }
  sessions: {
    index: typeof routes['sessions.index']
    revoke: typeof routes['sessions.revoke']
    revokeAll: typeof routes['sessions.revoke_all']
  }
  twoFactor: {
    setup: typeof routes['two_factor.setup']
    enable: typeof routes['two_factor.enable']
    disable: typeof routes['two_factor.disable']
    verify: typeof routes['two_factor.verify']
    regenerateRecoveryCodes: typeof routes['two_factor.regenerate_recovery_codes']
  }
  members: {
    index: typeof routes['members.index']
    invitations: typeof routes['members.invitations']
    dataAccessOptions: typeof routes['members.data_access_options']
    updateMember: typeof routes['members.update_member']
    destroy: typeof routes['members.destroy']
  }
  notifications: {
    index: typeof routes['notifications.index']
    markAsRead: typeof routes['notifications.mark_as_read']
    markAllAsRead: typeof routes['notifications.mark_all_as_read']
    unreadCount: typeof routes['notifications.unread_count']
    delete: typeof routes['notifications.delete']
  }
  audits: {
    index: typeof routes['audits.index']
    recent: typeof routes['audits.recent']
  }
  healthChecks: typeof routes['health_checks']
  attachments: typeof routes['attachments']
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
}
