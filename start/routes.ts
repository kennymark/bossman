/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import AutoSwagger from 'adonis-autoswagger'

import swagger from '#config/swagger'
import { controllers } from '#generated/controllers'

import { middleware } from './kernel.js'
import './api/api.js'
import { loginThrottle, throttle } from './limiter.js'

router.get('/', async ({ auth, response }) => {
  return auth.user ? response.redirect('/dashboard') : response.redirect('/login')
})

/**
 * Authenticated app pages (dashboard, teams, blog management).
 * Blog management routes are registered before `/blog/:slug` so `/blog/manage` is matched first.
 */
router
  .group(() => {
    router.get('/dashboard', [controllers.Dashboard, 'index'])
    router.get('/teams', [controllers.TeamsPage, 'index'])
    router.get('/teams/members/:id', [controllers.TeamsPage, 'show'])
    router.get('/leases', [controllers.Leases, 'index'])
    router.get('/leases/:id', [controllers.Leases, 'show'])
    router.get('/properties', [controllers.LeaseableEntities, 'index'])
    router.get('/properties/:id', [controllers.LeaseableEntities, 'show'])
    router.get('/orgs', [controllers.Orgs, 'index'])
    router.get('/orgs/create', [controllers.Orgs, 'create'])
    router.get('/orgs/:id/edit', [controllers.Orgs, 'edit'])
    router.get('/orgs/:id', [controllers.Orgs, 'show'])
    router.get('/orgs/:id/invoices/create', [controllers.Orgs, 'createInvoice'])
    router.post('/orgs/:id/invoices', [controllers.Orgs, 'storeInvoice'])
    router.get('/orgs/:id/invoices/:invoiceId/line-items/create', [
      controllers.Orgs,
      'createInvoiceLineItem',
    ])
    router.post('/orgs/:id/invoices/:invoiceId/line-items', [
      controllers.Orgs,
      'storeInvoiceLineItem',
    ])
    router.get('/push-notifications', [controllers.PushNotifications, 'index'])
    router.get('/push-notifications/create', [controllers.PushNotifications, 'create'])
    router.post('/push-notifications', [controllers.PushNotifications, 'store'])
    router.post('/push-notifications/:id/resend', [controllers.PushNotifications, 'resend'])
    router.get('/analytics', [controllers.Analytics, 'index'])
    router.get('/api-access', [controllers.ApiAccess, 'index'])
    router.get('/db-backups', [controllers.DbBackups, 'index'])
    router.get('/db-backups/:id/download', [controllers.DbBackups, 'download'])
    router.get('/logs', [controllers.LogsPage, 'index'])
    router.get('/servers', [controllers.Servers, 'index'])
    router.get('/servers/:projectId', [controllers.Servers, 'show'])
    router.get('/addons', [controllers.Addons, 'index'])
    router.get('/addons/create', [controllers.Addons, 'create'])
    router.post('/addons', [controllers.Addons, 'store'])
    router.get('/addons/:id/edit', [controllers.Addons, 'edit'])
    router.put('/addons/:id', [controllers.Addons, 'update'])
    router.get('/emails', [controllers.EmailsPage, 'index'])
    router.get('/emails/:id', [controllers.EmailsPage, 'show'])
    router.post('/db-backups', [controllers.DbBackups, 'store'])
    router.delete('/db-backups/:id', [controllers.DbBackups, 'destroy'])

    router
      .group(() => {
        router.get('/', [controllers.BlogPosts, 'adminIndex'])
        router.get('/create', [controllers.BlogPosts, 'create'])
        router.post('/', [controllers.BlogPosts, 'store'])
        router.get('/:id/edit', [controllers.BlogPosts, 'edit'])
        router.put('/:id', [controllers.BlogPosts, 'update'])
        router.delete('/:id', [controllers.BlogPosts, 'destroy'])

        router.get('/categories', [controllers.BlogCategories, 'index'])
        router.post('/categories', [controllers.BlogCategories, 'store'])
        router.delete('/categories/:id', [controllers.BlogCategories, 'destroy'])
      })
      .prefix('blog/manage')
  })
  .use([middleware.auth(), middleware.appRole(), middleware.pageAccess()])

// Guest routes (web login uses server redirect so session cookie is set in same navigation)
router
  .group(() => {
    router.get('/login', ({ inertia }) => inertia.render('login' as never, {}))
    router.get('/forgot-password', ({ inertia }) => inertia.render('forgot-password' as never, {}))
    router.get('/reset-password', ({ inertia }) => inertia.render('reset-password' as never, {}))
  })
  .use(middleware.guest())

// Public routes
router.get('/verify-email', ({ inertia }) => inertia.render('verify-email' as never, {}))
router.get('/verify-email-change', ({ inertia }) =>
  inertia.render('verify-email-change' as never, {}),
)
router.get('/confirm-delete-custom-user', [controllers.ConfirmDeleteCustomUser, 'respond'])
router.get('/account-deletion-result', ({ inertia }) =>
  inertia.render('account-deletion-result' as never, {}),
)
router.get('/blog', [controllers.BlogPosts, 'index'])
router.get('/blog/:slug', [controllers.BlogPosts, 'show'])
router.get('/join', [controllers.TeamInvitations, 'joinPage'])

// Authenticated routes
router
  .group(() => {
    router.get('/logout', [controllers.Auth, 'logout'])
  })
  .use([middleware.auth()])

// Settings page
router
  .group(() => {
    router.get('/settings', ({ inertia }) => inertia.render('settings/index' as never, {}))
  })
  .use([middleware.auth()])

router
  .group(() => {
    router.post('/login', [controllers.Auth, 'login']).use(loginThrottle)
    router.post('/forgot-password', [controllers.Auth, 'forgotPassword'])
    router.post('/reset-password', [controllers.Auth, 'resetPassword'])
    router.get('/verify-email', [controllers.Auth, 'verifyEmail'])
    router.get('/verify-email-change', [controllers.Auth, 'verifyEmailChange'])
    router
      .post('/verify-email/resend', [controllers.Auth, 'resendVerificationEmail'])
      .use(middleware.auth())
  })
  .prefix('api/v1/auth')
  .use(throttle)

router
  .group(() => {
    router.put('/profile', [controllers.Users, 'updateProfile'])
    router.put('/password', [controllers.Users, 'updatePassword'])
    router.post('/avatar', [controllers.Users, 'uploadAvatar'])
    router.delete('/avatar', [controllers.Users, 'deleteAvatar'])
    router.get('/sessions', [controllers.Sessions, 'index'])
    router.post('/sessions/revoke', [controllers.Sessions, 'revoke'])
    router.post('/sessions/revoke-all', [controllers.Sessions, 'revokeAll'])
    router.delete('/account', [controllers.Users, 'deleteAccount'])
    router.put('/settings', [controllers.Users, 'updateSettings'])
    router.get('/settings', [controllers.Users, 'getSettings'])
    router.post('/2fa/setup', [controllers.TwoFactor, 'setup'])
    router.post('/2fa/enable', [controllers.TwoFactor, 'enable'])
    router.post('/2fa/disable', [controllers.TwoFactor, 'disable'])
    router.post('/2fa/verify', [controllers.TwoFactor, 'verify'])
    router.post('/2fa/recovery-codes', [controllers.TwoFactor, 'regenerateRecoveryCodes'])
  })
  .prefix('api/v1/user')
  .use(middleware.auth())

// Members and invitations (no teams)
router
  .group(() => {
    router.get('/', [controllers.Members, 'index'])
    router.get('/invitations', [controllers.Members, 'invitations'])
    router.get('/data-access-options', [controllers.Members, 'dataAccessOptions'])
    router.put('/:memberId', [controllers.Members, 'updateMember'])
    router.delete('/:memberId', [controllers.Members, 'destroy'])
  })
  .prefix('api/v1/members')
  .use([middleware.auth(), middleware.appRole(), middleware.pageAccess({ page: 'teams' })])

router
  .group(() => {
    router.post('/', [controllers.TeamInvitations, 'invite'])
    router.put('/:invitationId', [controllers.TeamInvitations, 'updateInvitation'])
    router.delete('/:invitationId', [controllers.TeamInvitations, 'destroy'])
    router.post('/:invitationId/invite-link', [controllers.TeamInvitations, 'inviteLink'])
  })
  .prefix('api/v1/invitations')
  .use([middleware.auth(), middleware.appRole(), middleware.pageAccess({ page: 'teams' })])

// Public team invitation routes
router
  .group(() => {
    router.post('/accept', [controllers.TeamInvitations, 'accept'])
  })
  .prefix('api/v1/team-invitations')

// Notification routes
router
  .group(() => {
    router.get('/', [controllers.Notifications, 'index'])
    router.post('/mark-as-read', [controllers.Notifications, 'markAsRead'])
    router.post('/mark-all-as-read', [controllers.Notifications, 'markAllAsRead'])
    router.get('/unread-count', [controllers.Notifications, 'unreadCount'])
    router.delete('/:id', [controllers.Notifications, 'delete'])
  })
  .prefix('api/v1/notifications')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/', [controllers.Audits, 'index'])
    router.get('/recent', [controllers.Audits, 'recent'])
  })
  .prefix('api/v1/audits')
  .use(middleware.auth())

router.get('/health', [controllers.HealthChecks])

/**
 * API documentation. Behind auth + admin role: these routes describe the whole internal
 * API surface and were previously reachable by anyone.
 */
router
  .group(() => {
    router.get('/swagger', async () => {
      return AutoSwagger.default.docs(router.toJSON(), swagger)
    })

    // Renders Swagger-UI and passes YAML-output of /swagger
    router.get('/docs/:id?', async ({ params }) => {
      /** Route params arrive as strings, so compare as strings. */
      const id = String(params.id ?? '')

      if (id === '1') {
        return AutoSwagger.default.rapidoc('/swagger')
      }
      if (id === '2') {
        return AutoSwagger.default.ui('/swagger')
      }
      return AutoSwagger.default.scalar('/swagger')
    })
  })
  .use([middleware.auth(), middleware.appRole()])
router.attachments()
transmit.registerRoutes()
