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
import { GoogleService } from '#services/google_service'
import { middleware } from './kernel.js'
import { throttle } from './limiter.js'

const AuthController = () => import('#controllers/auth_controller')
const HealthChecksController = () => import('#controllers/health_checks_controller')
const UsersController = () => import('#controllers/users_controller')
const TwoFactorController = () => import('#controllers/two_factor_controller')
const SessionsController = () => import('#controllers/sessions_controller')
const ContactController = () => import('#controllers/contact_controller')
const NotificationsController = () => import('#controllers/notifications_controller')
const AuditsController = () => import('#controllers/audits_controller')
const TeamsController = () => import('#controllers/teams_controller')
const TeamInvitationsController = () => import('#controllers/team_invitations_controller')
const BlogPostsController = () => import('#controllers/blog_posts_controller')
const BlogCategoriesController = () => import('#controllers/blog_categories_controller')
const BlogTagsController = () => import('#controllers/blog_tags_controller')
const BlogAuthorsController = () => import('#controllers/blog_authors_controller')
const AdminController = () => import('#controllers/admin_controller')
const AdminUsersController = () => import('#controllers/admin_users_controller')
const AdminTeamsController = () => import('#controllers/admin_teams_controller')

router.on('/').renderInertia('home')
router.on('/home').renderInertia('home')

/**
 * Authenticated app pages (dashboard, users, teams, blog management).
 * Blog management routes are registered before `/blog/:slug` so `/blog/manage` is matched first.
 */
router
  .group(() => {
    router.get('/dashboard', [AdminController, 'index'])
    router.get('/users', [AdminUsersController, 'index'])
    router.get('/users/:id/edit', [AdminUsersController, 'edit'])
    router.get('/users/:id', [AdminUsersController, 'show'])
    router.put('/users/:id', [AdminUsersController, 'update'])
    router.get('/teams', [AdminTeamsController, 'index'])

    router
      .group(() => {
        router.get('/', [BlogPostsController, 'adminIndex'])
        router.get('/create', [BlogPostsController, 'create'])
        router.post('/', [BlogPostsController, 'store'])
        router.get('/:id/edit', [BlogPostsController, 'edit'])
        router.put('/:id', [BlogPostsController, 'update'])
        router.delete('/:id', [BlogPostsController, 'destroy'])

        router.get('/categories', [BlogCategoriesController, 'index'])
        router.post('/categories', [BlogCategoriesController, 'store'])
        router.delete('/categories/:id', [BlogCategoriesController, 'destroy'])

        router.get('/tags', [BlogTagsController, 'index'])
        router.post('/tags', [BlogTagsController, 'store'])
        router.delete('/tags/:id', [BlogTagsController, 'destroy'])

        router.get('/authors', [BlogAuthorsController, 'index'])
        router.post('/authors', [BlogAuthorsController, 'store'])
        router.delete('/authors/:id', [BlogAuthorsController, 'destroy'])
      })
      .prefix('blog/manage')
  })
  .use([middleware.auth(), middleware.admin(), middleware.adminAccess()])

// Guest routes
router
  .group(() => {
    router.on('/login').renderInertia('login')
    router.on('/forgot-password').renderInertia('forgot-password')
    router.on('/reset-password').renderInertia('reset-password')
  })
  .use(middleware.guest())

// Public routes
router.on('/contact').renderInertia('contact')
router.on('/verify-email').renderInertia('verify-email')
router.on('/verify-email-change').renderInertia('verify-email-change')
router.get('/blog', [BlogPostsController, 'index'])
router.get('/blog/:slug', [BlogPostsController, 'show'])
router.get('/join', [TeamInvitationsController, 'joinPage'])

// Authenticated routes
router
  .group(() => {
    router.get('/logout', [AuthController, 'logout'])
  })
  .use([middleware.auth()])

// Settings page
router
  .group(() => {
    router.on('/settings').renderInertia('settings/index')
  })
  .use([middleware.auth()])

router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.post('/forgot-password', [AuthController, 'forgotPassword'])
    router.post('/reset-password', [AuthController, 'resetPassword'])
    router.get('/verify-email', [AuthController, 'verifyEmail'])
    router.get('/verify-email-change', [AuthController, 'verifyEmailChange'])
    router
      .post('/verify-email/resend', [AuthController, 'resendVerificationEmail'])
      .use(middleware.auth())
  })
  .prefix('api/v1/auth')
  .use(throttle)

// Public API routes
router
  .group(() => {
    router.post('/contact', [ContactController, 'send'])
  })
  .prefix('api/v1')
  .use(throttle)

router
  .group(() => {
    router.put('/profile', [UsersController, 'updateProfile'])
    router.put('/password', [UsersController, 'updatePassword'])
    router.post('/avatar', [UsersController, 'uploadAvatar'])
    router.delete('/avatar', [UsersController, 'deleteAvatar'])
    router.get('/sessions', [SessionsController, 'index'])
    router.post('/sessions/revoke', [SessionsController, 'revoke'])
    router.post('/sessions/revoke-all', [SessionsController, 'revokeAll'])
    router.delete('/account', [UsersController, 'deleteAccount'])
    router.put('/settings', [UsersController, 'updateSettings'])
    router.get('/settings', [UsersController, 'getSettings'])
    router.post('/2fa/setup', [TwoFactorController, 'setup'])
    router.post('/2fa/enable', [TwoFactorController, 'enable'])
    router.post('/2fa/disable', [TwoFactorController, 'disable'])
    router.post('/2fa/verify', [TwoFactorController, 'verify'])
    router.post('/2fa/recovery-codes', [TwoFactorController, 'regenerateRecoveryCodes'])
  })
  .prefix('api/v1/user')
  .use(middleware.auth())

// Team routes
router
  .group(() => {
    router.get('/', [TeamsController, 'index'])
    router.post('/', [TeamsController, 'store'])
    router.get('/:teamId/members', [TeamsController, 'members'])
    router.post('/:teamId/invitations', [TeamInvitationsController, 'invite'])
  })
  .prefix('api/v1/teams')
  .use(middleware.auth())

// Public team invitation routes
router
  .group(() => {
    router.post('/accept', [TeamInvitationsController, 'accept'])
  })
  .prefix('api/v1/team-invitations')

// Notification routes
router
  .group(() => {
    router.get('/', [NotificationsController, 'index'])
    router.post('/mark-as-read', [NotificationsController, 'markAsRead'])
    router.post('/mark-all-as-read', [NotificationsController, 'markAllAsRead'])
    router.get('/unread-count', [NotificationsController, 'unreadCount'])
    router.delete('/:id', [NotificationsController, 'delete'])
  })
  .prefix('api/v1/notifications')
  .use(middleware.auth())

// Web route (kept for compatibility with non-AJAX form posts)
router.post('/contact', [ContactController, 'send']).use(throttle)

router
  .group(() => {
    router.get('/', [AuditsController, 'index'])
    router.get('/recent', [AuditsController, 'recent'])
  })
  .prefix('api/v1/audits')
  .use(middleware.auth())

router.get('/health', [HealthChecksController])

router.get('/google/redirect', ({ ally }) => {
  const google = ally.use('google')
  return google.redirect()
})

router.get('/google/callback', async ({ ally, auth, response, session }) => {
  const google = ally.use('google')

  if (google.accessDenied()) {
    session.flash('error', { message: 'You have cancelled the login process' })
    return response.redirect('/login')
  }

  if (google.stateMisMatch()) {
    session.flash('error', { message: 'We are unable to verify the request. Please try again' })
    return response.redirect('/login')
  }

  if (google.hasError()) {
    session.flash('error', { message: google.getError() })
    return response.redirect('/login')
  }

  const googleUser = await google.user()
  // @ts-expect-error - GoogleUser is the same as the type in the GoogleService
  const user = await new GoogleService().createOrLoginWithGoogle(googleUser)
  await auth.use('web').login(user)
  return response.redirect('/dashboard')
})

transmit.registerRoutes()

router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

// Renders Swagger-UI and passes YAML-output of /swagger
router.get('/docs', async () => {
  return AutoSwagger.default.rapidoc('/swagger')
  // return AutoSwagger.default.scalar("/swagger"); to use Scalar instead. If you want, you can pass proxy url as second argument here.
  // return AutoSwagger.default.rapidoc("/swagger", "view"); to use RapiDoc instead (pass "view" default, or "read" to change the render-style)
})
