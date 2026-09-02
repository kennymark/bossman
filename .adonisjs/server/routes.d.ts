import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'server-stats.api': { paramsTuple?: []; params?: {} }
    'server-stats.debug.config': { paramsTuple?: []; params?: {} }
    'server-stats.debug.diagnostics': { paramsTuple?: []; params?: {} }
    'server-stats.debug.queries': { paramsTuple?: []; params?: {} }
    'server-stats.debug.events': { paramsTuple?: []; params?: {} }
    'server-stats.debug.routes': { paramsTuple?: []; params?: {} }
    'server-stats.debug.queryExplain': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server-stats.debug.logs': { paramsTuple?: []; params?: {} }
    'server-stats.debug.emails': { paramsTuple?: []; params?: {} }
    'server-stats.debug.emailPreview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server-stats.debug.traces': { paramsTuple?: []; params?: {} }
    'server-stats.debug.traceDetail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'api_access.stats': { paramsTuple?: []; params?: {} }
    'analytics.orgs_stats': { paramsTuple?: []; params?: {} }
    'analytics.orgs_entities': { paramsTuple?: []; params?: {} }
    'analytics.users_stats': { paramsTuple?: []; params?: {} }
    'analytics.users_entities': { paramsTuple?: []; params?: {} }
    'analytics.leases_stats': { paramsTuple?: []; params?: {} }
    'analytics.leases_entities': { paramsTuple?: []; params?: {} }
    'analytics.maintenance_stats': { paramsTuple?: []; params?: {} }
    'analytics.maintenance_entities': { paramsTuple?: []; params?: {} }
    'analytics.activity_stats': { paramsTuple?: []; params?: {} }
    'analytics.activity_entities': { paramsTuple?: []; params?: {} }
    'dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.recent_activity': { paramsTuple?: []; params?: {} }
    'leases.stats': { paramsTuple?: []; params?: {} }
    'leases.payments': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leases.activity': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.stats': { paramsTuple?: []; params?: {} }
    'leaseable_entities.leases': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.activity': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.stats': { paramsTuple?: []; params?: {} }
    'orgs.store': { paramsTuple?: []; params?: {} }
    'orgs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'org_actions.ban_user': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.unban_user': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.make_favourite': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.undo_favourite': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.make_test_account': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.undo_test_account': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.toggle_sales_account': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.request_delete_custom_user': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.bulk_preview': { paramsTuple?: []; params?: {} }
    'org_actions.bulk_make_favourite': { paramsTuple?: []; params?: {} }
    'org_actions.bulk_undo_favourite': { paramsTuple?: []; params?: {} }
    'org_actions.bulk_make_test_account': { paramsTuple?: []; params?: {} }
    'org_actions.bulk_undo_test_account': { paramsTuple?: []; params?: {} }
    'org_actions.get_ban_status': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'orgs.leases': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.properties': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.activities': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.invoices': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'push_notifications.users': { paramsTuple?: []; params?: {} }
    'api.db_backups.store': { paramsTuple?: []; params?: {} }
    'db_backups.health': { paramsTuple?: []; params?: {} }
    'db_backups.restore_preview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'db_backups.restore': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'emails.index': { paramsTuple?: []; params?: {} }
    'emails.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.projects': { paramsTuple?: []; params?: {} }
    'railway.project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployments': { paramsTuple: [ParamValue]; params: {'serviceId': ParamValue} }
    'railway.deployment_logs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployment_build_logs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployment_restart': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployment_redeploy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.service_deploy': { paramsTuple: [ParamValue]; params: {'serviceId': ParamValue} }
    'railway.refresh': { paramsTuple?: []; params?: {} }
    'app_env.show': { paramsTuple?: []; params?: {} }
    'app_env.update': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'teams_page.index': { paramsTuple?: []; params?: {} }
    'teams_page.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leases.index': { paramsTuple?: []; params?: {} }
    'leases.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.index': { paramsTuple?: []; params?: {} }
    'leaseable_entities.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.index': { paramsTuple?: []; params?: {} }
    'orgs.create': { paramsTuple?: []; params?: {} }
    'orgs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.create_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.store_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.create_invoice_line_item': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'invoiceId': ParamValue} }
    'orgs.store_invoice_line_item': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'invoiceId': ParamValue} }
    'push_notifications.index': { paramsTuple?: []; params?: {} }
    'push_notifications.create': { paramsTuple?: []; params?: {} }
    'push_notifications.store': { paramsTuple?: []; params?: {} }
    'push_notifications.resend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.index': { paramsTuple?: []; params?: {} }
    'api_access.index': { paramsTuple?: []; params?: {} }
    'db_backups.index': { paramsTuple?: []; params?: {} }
    'db_backups.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'logs_page.index': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'addons.index': { paramsTuple?: []; params?: {} }
    'addons.create': { paramsTuple?: []; params?: {} }
    'addons.store': { paramsTuple?: []; params?: {} }
    'addons.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'addons.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'emails_page.index': { paramsTuple?: []; params?: {} }
    'emails_page.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'db_backups.store': { paramsTuple?: []; params?: {} }
    'db_backups.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'audits.page': { paramsTuple?: []; params?: {} }
    'blog_posts.admin_index': { paramsTuple?: []; params?: {} }
    'blog_posts.create': { paramsTuple?: []; params?: {} }
    'blog_posts.store': { paramsTuple?: []; params?: {} }
    'blog_posts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog_posts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog_posts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog_categories.index': { paramsTuple?: []; params?: {} }
    'blog_categories.store': { paramsTuple?: []; params?: {} }
    'blog_categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'confirm_delete_custom_user.respond': { paramsTuple?: []; params?: {} }
    'blog_posts.index': { paramsTuple?: []; params?: {} }
    'blog_posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'team_invitations.join_page': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.two_factor_challenge': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.verify_email_change': { paramsTuple?: []; params?: {} }
    'auth.resend_verification_email': { paramsTuple?: []; params?: {} }
    'users.update_profile': { paramsTuple?: []; params?: {} }
    'users.update_password': { paramsTuple?: []; params?: {} }
    'users.upload_avatar': { paramsTuple?: []; params?: {} }
    'users.delete_avatar': { paramsTuple?: []; params?: {} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'sessions.revoke': { paramsTuple?: []; params?: {} }
    'sessions.revoke_all': { paramsTuple?: []; params?: {} }
    'users.delete_account': { paramsTuple?: []; params?: {} }
    'users.update_settings': { paramsTuple?: []; params?: {} }
    'users.get_settings': { paramsTuple?: []; params?: {} }
    'two_factor.status': { paramsTuple?: []; params?: {} }
    'two_factor.setup': { paramsTuple?: []; params?: {} }
    'two_factor.enable': { paramsTuple?: []; params?: {} }
    'two_factor.disable': { paramsTuple?: []; params?: {} }
    'two_factor.verify': { paramsTuple?: []; params?: {} }
    'two_factor.regenerate_recovery_codes': { paramsTuple?: []; params?: {} }
    'members.index': { paramsTuple?: []; params?: {} }
    'members.invitations': { paramsTuple?: []; params?: {} }
    'members.data_access_options': { paramsTuple?: []; params?: {} }
    'members.update_member': { paramsTuple: [ParamValue]; params: {'memberId': ParamValue} }
    'members.destroy': { paramsTuple: [ParamValue]; params: {'memberId': ParamValue} }
    'team_invitations.invite': { paramsTuple?: []; params?: {} }
    'team_invitations.update_invitation': { paramsTuple: [ParamValue]; params: {'invitationId': ParamValue} }
    'team_invitations.destroy': { paramsTuple: [ParamValue]; params: {'invitationId': ParamValue} }
    'team_invitations.invite_link': { paramsTuple: [ParamValue]; params: {'invitationId': ParamValue} }
    'team_invitations.accept': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.mark_as_read': { paramsTuple?: []; params?: {} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'notifications.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'audits.index': { paramsTuple?: []; params?: {} }
    'audits.recent': { paramsTuple?: []; params?: {} }
    'audits.actions': { paramsTuple?: []; params?: {} }
    'audits.actors': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'attachments': { paramsTuple: [ParamValue,ParamValue?]; params: {'key': ParamValue,'name'?: ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'server-stats.api': { paramsTuple?: []; params?: {} }
    'server-stats.debug.config': { paramsTuple?: []; params?: {} }
    'server-stats.debug.diagnostics': { paramsTuple?: []; params?: {} }
    'server-stats.debug.queries': { paramsTuple?: []; params?: {} }
    'server-stats.debug.events': { paramsTuple?: []; params?: {} }
    'server-stats.debug.routes': { paramsTuple?: []; params?: {} }
    'server-stats.debug.queryExplain': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server-stats.debug.logs': { paramsTuple?: []; params?: {} }
    'server-stats.debug.emails': { paramsTuple?: []; params?: {} }
    'server-stats.debug.emailPreview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server-stats.debug.traces': { paramsTuple?: []; params?: {} }
    'server-stats.debug.traceDetail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'api_access.stats': { paramsTuple?: []; params?: {} }
    'analytics.orgs_stats': { paramsTuple?: []; params?: {} }
    'analytics.orgs_entities': { paramsTuple?: []; params?: {} }
    'analytics.users_stats': { paramsTuple?: []; params?: {} }
    'analytics.users_entities': { paramsTuple?: []; params?: {} }
    'analytics.leases_stats': { paramsTuple?: []; params?: {} }
    'analytics.leases_entities': { paramsTuple?: []; params?: {} }
    'analytics.maintenance_stats': { paramsTuple?: []; params?: {} }
    'analytics.maintenance_entities': { paramsTuple?: []; params?: {} }
    'analytics.activity_stats': { paramsTuple?: []; params?: {} }
    'analytics.activity_entities': { paramsTuple?: []; params?: {} }
    'dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.recent_activity': { paramsTuple?: []; params?: {} }
    'leases.stats': { paramsTuple?: []; params?: {} }
    'leases.payments': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leases.activity': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.stats': { paramsTuple?: []; params?: {} }
    'leaseable_entities.leases': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.activity': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.stats': { paramsTuple?: []; params?: {} }
    'org_actions.get_ban_status': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'orgs.leases': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.properties': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.activities': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.invoices': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'push_notifications.users': { paramsTuple?: []; params?: {} }
    'db_backups.health': { paramsTuple?: []; params?: {} }
    'emails.index': { paramsTuple?: []; params?: {} }
    'emails.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.projects': { paramsTuple?: []; params?: {} }
    'railway.project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployments': { paramsTuple: [ParamValue]; params: {'serviceId': ParamValue} }
    'railway.deployment_logs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployment_build_logs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app_env.show': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'teams_page.index': { paramsTuple?: []; params?: {} }
    'teams_page.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leases.index': { paramsTuple?: []; params?: {} }
    'leases.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.index': { paramsTuple?: []; params?: {} }
    'leaseable_entities.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.index': { paramsTuple?: []; params?: {} }
    'orgs.create': { paramsTuple?: []; params?: {} }
    'orgs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.create_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.create_invoice_line_item': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'invoiceId': ParamValue} }
    'push_notifications.index': { paramsTuple?: []; params?: {} }
    'push_notifications.create': { paramsTuple?: []; params?: {} }
    'analytics.index': { paramsTuple?: []; params?: {} }
    'api_access.index': { paramsTuple?: []; params?: {} }
    'db_backups.index': { paramsTuple?: []; params?: {} }
    'db_backups.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'logs_page.index': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'addons.index': { paramsTuple?: []; params?: {} }
    'addons.create': { paramsTuple?: []; params?: {} }
    'addons.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'emails_page.index': { paramsTuple?: []; params?: {} }
    'emails_page.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'audits.page': { paramsTuple?: []; params?: {} }
    'blog_posts.admin_index': { paramsTuple?: []; params?: {} }
    'blog_posts.create': { paramsTuple?: []; params?: {} }
    'blog_posts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog_categories.index': { paramsTuple?: []; params?: {} }
    'confirm_delete_custom_user.respond': { paramsTuple?: []; params?: {} }
    'blog_posts.index': { paramsTuple?: []; params?: {} }
    'blog_posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'team_invitations.join_page': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.verify_email_change': { paramsTuple?: []; params?: {} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'users.get_settings': { paramsTuple?: []; params?: {} }
    'two_factor.status': { paramsTuple?: []; params?: {} }
    'members.index': { paramsTuple?: []; params?: {} }
    'members.invitations': { paramsTuple?: []; params?: {} }
    'members.data_access_options': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'audits.index': { paramsTuple?: []; params?: {} }
    'audits.recent': { paramsTuple?: []; params?: {} }
    'audits.actions': { paramsTuple?: []; params?: {} }
    'audits.actors': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'attachments': { paramsTuple: [ParamValue,ParamValue?]; params: {'key': ParamValue,'name'?: ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'server-stats.api': { paramsTuple?: []; params?: {} }
    'server-stats.debug.config': { paramsTuple?: []; params?: {} }
    'server-stats.debug.diagnostics': { paramsTuple?: []; params?: {} }
    'server-stats.debug.queries': { paramsTuple?: []; params?: {} }
    'server-stats.debug.events': { paramsTuple?: []; params?: {} }
    'server-stats.debug.routes': { paramsTuple?: []; params?: {} }
    'server-stats.debug.queryExplain': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server-stats.debug.logs': { paramsTuple?: []; params?: {} }
    'server-stats.debug.emails': { paramsTuple?: []; params?: {} }
    'server-stats.debug.emailPreview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server-stats.debug.traces': { paramsTuple?: []; params?: {} }
    'server-stats.debug.traceDetail': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'api_access.stats': { paramsTuple?: []; params?: {} }
    'analytics.orgs_stats': { paramsTuple?: []; params?: {} }
    'analytics.orgs_entities': { paramsTuple?: []; params?: {} }
    'analytics.users_stats': { paramsTuple?: []; params?: {} }
    'analytics.users_entities': { paramsTuple?: []; params?: {} }
    'analytics.leases_stats': { paramsTuple?: []; params?: {} }
    'analytics.leases_entities': { paramsTuple?: []; params?: {} }
    'analytics.maintenance_stats': { paramsTuple?: []; params?: {} }
    'analytics.maintenance_entities': { paramsTuple?: []; params?: {} }
    'analytics.activity_stats': { paramsTuple?: []; params?: {} }
    'analytics.activity_entities': { paramsTuple?: []; params?: {} }
    'dashboard.stats': { paramsTuple?: []; params?: {} }
    'dashboard.recent_activity': { paramsTuple?: []; params?: {} }
    'leases.stats': { paramsTuple?: []; params?: {} }
    'leases.payments': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leases.activity': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.stats': { paramsTuple?: []; params?: {} }
    'leaseable_entities.leases': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.activity': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.stats': { paramsTuple?: []; params?: {} }
    'org_actions.get_ban_status': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'orgs.leases': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.properties': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.activities': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.invoices': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'push_notifications.users': { paramsTuple?: []; params?: {} }
    'db_backups.health': { paramsTuple?: []; params?: {} }
    'emails.index': { paramsTuple?: []; params?: {} }
    'emails.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.projects': { paramsTuple?: []; params?: {} }
    'railway.project': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployments': { paramsTuple: [ParamValue]; params: {'serviceId': ParamValue} }
    'railway.deployment_logs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployment_build_logs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app_env.show': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'teams_page.index': { paramsTuple?: []; params?: {} }
    'teams_page.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leases.index': { paramsTuple?: []; params?: {} }
    'leases.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'leaseable_entities.index': { paramsTuple?: []; params?: {} }
    'leaseable_entities.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.index': { paramsTuple?: []; params?: {} }
    'orgs.create': { paramsTuple?: []; params?: {} }
    'orgs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.create_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.create_invoice_line_item': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'invoiceId': ParamValue} }
    'push_notifications.index': { paramsTuple?: []; params?: {} }
    'push_notifications.create': { paramsTuple?: []; params?: {} }
    'analytics.index': { paramsTuple?: []; params?: {} }
    'api_access.index': { paramsTuple?: []; params?: {} }
    'db_backups.index': { paramsTuple?: []; params?: {} }
    'db_backups.download': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'logs_page.index': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'projectId': ParamValue} }
    'addons.index': { paramsTuple?: []; params?: {} }
    'addons.create': { paramsTuple?: []; params?: {} }
    'addons.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'emails_page.index': { paramsTuple?: []; params?: {} }
    'emails_page.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'audits.page': { paramsTuple?: []; params?: {} }
    'blog_posts.admin_index': { paramsTuple?: []; params?: {} }
    'blog_posts.create': { paramsTuple?: []; params?: {} }
    'blog_posts.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog_categories.index': { paramsTuple?: []; params?: {} }
    'confirm_delete_custom_user.respond': { paramsTuple?: []; params?: {} }
    'blog_posts.index': { paramsTuple?: []; params?: {} }
    'blog_posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'team_invitations.join_page': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.verify_email_change': { paramsTuple?: []; params?: {} }
    'sessions.index': { paramsTuple?: []; params?: {} }
    'users.get_settings': { paramsTuple?: []; params?: {} }
    'two_factor.status': { paramsTuple?: []; params?: {} }
    'members.index': { paramsTuple?: []; params?: {} }
    'members.invitations': { paramsTuple?: []; params?: {} }
    'members.data_access_options': { paramsTuple?: []; params?: {} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.unread_count': { paramsTuple?: []; params?: {} }
    'audits.index': { paramsTuple?: []; params?: {} }
    'audits.recent': { paramsTuple?: []; params?: {} }
    'audits.actions': { paramsTuple?: []; params?: {} }
    'audits.actors': { paramsTuple?: []; params?: {} }
    'health_checks': { paramsTuple?: []; params?: {} }
    'attachments': { paramsTuple: [ParamValue,ParamValue?]; params: {'key': ParamValue,'name'?: ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'orgs.store': { paramsTuple?: []; params?: {} }
    'org_actions.ban_user': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.unban_user': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.make_favourite': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.undo_favourite': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.make_test_account': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.undo_test_account': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.toggle_sales_account': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.request_delete_custom_user': { paramsTuple: [ParamValue]; params: {'orgId': ParamValue} }
    'org_actions.bulk_preview': { paramsTuple?: []; params?: {} }
    'org_actions.bulk_make_favourite': { paramsTuple?: []; params?: {} }
    'org_actions.bulk_undo_favourite': { paramsTuple?: []; params?: {} }
    'org_actions.bulk_make_test_account': { paramsTuple?: []; params?: {} }
    'org_actions.bulk_undo_test_account': { paramsTuple?: []; params?: {} }
    'api.db_backups.store': { paramsTuple?: []; params?: {} }
    'db_backups.restore_preview': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'db_backups.restore': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployment_restart': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.deployment_redeploy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'railway.service_deploy': { paramsTuple: [ParamValue]; params: {'serviceId': ParamValue} }
    'railway.refresh': { paramsTuple?: []; params?: {} }
    'orgs.store_invoice': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orgs.store_invoice_line_item': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'invoiceId': ParamValue} }
    'push_notifications.store': { paramsTuple?: []; params?: {} }
    'push_notifications.resend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'addons.store': { paramsTuple?: []; params?: {} }
    'db_backups.store': { paramsTuple?: []; params?: {} }
    'blog_posts.store': { paramsTuple?: []; params?: {} }
    'blog_categories.store': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.two_factor_challenge': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.resend_verification_email': { paramsTuple?: []; params?: {} }
    'users.upload_avatar': { paramsTuple?: []; params?: {} }
    'sessions.revoke': { paramsTuple?: []; params?: {} }
    'sessions.revoke_all': { paramsTuple?: []; params?: {} }
    'two_factor.setup': { paramsTuple?: []; params?: {} }
    'two_factor.enable': { paramsTuple?: []; params?: {} }
    'two_factor.disable': { paramsTuple?: []; params?: {} }
    'two_factor.verify': { paramsTuple?: []; params?: {} }
    'two_factor.regenerate_recovery_codes': { paramsTuple?: []; params?: {} }
    'team_invitations.invite': { paramsTuple?: []; params?: {} }
    'team_invitations.invite_link': { paramsTuple: [ParamValue]; params: {'invitationId': ParamValue} }
    'team_invitations.accept': { paramsTuple?: []; params?: {} }
    'notifications.mark_as_read': { paramsTuple?: []; params?: {} }
    'notifications.mark_all_as_read': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'orgs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app_env.update': { paramsTuple?: []; params?: {} }
    'addons.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog_posts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update_profile': { paramsTuple?: []; params?: {} }
    'users.update_password': { paramsTuple?: []; params?: {} }
    'users.update_settings': { paramsTuple?: []; params?: {} }
    'members.update_member': { paramsTuple: [ParamValue]; params: {'memberId': ParamValue} }
    'team_invitations.update_invitation': { paramsTuple: [ParamValue]; params: {'invitationId': ParamValue} }
  }
  DELETE: {
    'db_backups.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog_posts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'blog_categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.delete_avatar': { paramsTuple?: []; params?: {} }
    'users.delete_account': { paramsTuple?: []; params?: {} }
    'members.destroy': { paramsTuple: [ParamValue]; params: {'memberId': ParamValue} }
    'team_invitations.destroy': { paramsTuple: [ParamValue]; params: {'invitationId': ParamValue} }
    'notifications.delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}