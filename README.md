# Togetha Admin

Internal admin app for [Togetha](https://togetha.co.uk) — property and tenancy management for landlords, agencies, and tenants.

It is an operator console rather than a customer-facing product: it reads and writes the Togetha application databases directly, manages Stripe billing, drives push notifications, restores backups, and controls team access. Treat every change here as production-adjacent.

## Stack

| Layer    | Choice                                                            |
| -------- | ----------------------------------------------------------------- |
| Backend  | AdonisJS 7, TypeScript, Lucid ORM                                 |
| Frontend | Inertia.js + React 19, Vite 7, Tailwind CSS 4                     |
| UI       | shadcn-style components on Base UI primitives, Tabler icons       |
| Data     | TanStack Query (client), VineJS (validation), Formik (multi-step) |
| Database | PostgreSQL (three connections — see below)                        |
| Jobs     | pg-boss                                                           |
| Search   | Meilisearch                                                       |
| Runtime  | Node 24+, npm 10+                                                 |

## The three databases

This is the most important thing to understand before changing anything.

| Connection | Env var    | Holds                                                         |
| ---------- | ---------- | ------------------------------------------------------------- |
| `default`  | `ADMIN_DB` | This app's own tables — users, team members, audits, sessions |
| `dev`      | `DEV_DB`   | The Togetha **development** application database              |
| `prod`     | `PROD_DB`  | The Togetha **production** application database               |

Admin tables always use `default`. Anything reading customer data — orgs, leases, properties, payments — must pass an explicit connection:

```ts
const appEnv = request.appEnv()
const orgs = await Org.query({ connection: appEnv })
```

`request.appEnv()` is resolved once per request by `AppEnvMiddleware` and is **derived from the authenticated user, never from request input**:

- God admins (`isGodAdmin`) may switch between `dev` and `prod`
- Members granted `enableProdAccess` are pinned to `prod`, until `prodAccessExpiresAt` passes
- Everyone else is pinned to `dev`

Production grants can be time-boxed. Granting one requires a god admin and a stated reason, both recorded in the audit trail; the `expire-prod-access` cron clears lapsed grants hourly.

The session records a _preference_; `resolveAppEnv` in `app/services/app_env_service.ts` decides what is actually honoured. Never reintroduce a header or query-param fallback — that is a direct path to production data.

## Authorization

Two independent gates, both applied by route groups rather than inside controllers:

1. **`appRole`** — the user must be `admin` or `super_admin`.
2. **`pageAccess`** — a team member may be restricted to a subset of pages via `team_members.allowed_pages`. The required grant is derived from the request path by `requiredPageKeyForPath` in `app/utils/page_access.ts`, which maps a page and the `/api/v1` route behind it to the same key. Pass `pageAccess({ page: 'teams' })` when a path does not name its own page.

Add new admin routes inside an existing gated group. A route added outside one is reachable by any signed-in user.

## Auditing

Two complementary trails, both in `ADMIN_DB`:

- **`admin_actions`** — operator intent: who, what, which environment, why, and whether it worked. Written by `recordAdminAction` and read at `/audits`. A regular admin sees their own; god and super admins see everyone's.
- **`audits`** — model field diffs from `@stouder-io/adonis-auditing`, for models that opt into the `Auditable` mixin.

Destructive actions (restore, ban, bulk org updates, member removal, backup deletion) require a retyped confirmation phrase and a reason, both enforced server-side. Restore and bulk updates offer a dry run that reports exactly what would change before anything is written.

## Getting started

### Prerequisites

- Node 24+ and npm 10+
- PostgreSQL 16 (local, for the test suite)
- Access to the Togetha dev/prod database URLs

### Setup

```bash
npm install
cp .env.example .env      # then fill in the values
node ace generate:key     # sets APP_KEY
node ace migration:run    # migrates ADMIN_DB only
npm run dev
```

The dev server prints its URL; `PORT` in `.env` controls it.

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server with HMR              |
| `npm run build`     | Production build into `build/`   |
| `npm start`         | Run the production server        |
| `npm test`          | Japa test suite                  |
| `npm run typecheck` | `tsc --noEmit`                   |
| `npm run fmt`       | Format with oxfmt                |
| `npm run fmt:check` | Check formatting without writing |
| `npm run refresh`   | Regenerate route types           |
| `npm run email:dev` | Preview React Email templates    |

## Testing

The suite runs against a local PostgreSQL database, configured by the committed `.env.test`:

```bash
createuser -s postgres 2>/dev/null || true
createdb -O postgres boss_man_test
npm test
```

`tests/bootstrap.ts` migrates the database before the run and rolls it back afterwards, and clears the rate limiter between tests so throttled routes do not leak 429s across cases.

- `tests/unit/` — pure logic (`app_env`, `page_access`, `confirmation`, `two_factor`, user model, utils)
- `tests/functional/` — HTTP behaviour (`auth`, `two_factor_login`, `transmit_channels`, `authorization`, `health`)

Authorization changes should come with a test in `tests/functional/authorization.spec.ts`.

## Background jobs

pg-boss, wired through a small typed builder in `boss/base.ts`:

```ts
export const myJob = worker
  .createJob('my-job')
  .input(vine.object({ id: vine.number(), env: vine.enum(['dev', 'prod'] as const) }))
  .retry({ limit: 3, delay: 60, backoff: true })
  .work(async ({ id, env }) => {
    /* ... */
  })
```

Drop a file in `boss/jobs/` and it is picked up automatically. Register recurring work in `boss/crons.ts`. The queue is preloaded **only in the `web` environment** — it must not start inside ace commands or tests, or those processes never exit.

## Configuration

| File                     | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `adonisrc.ts`            | Providers, preloads, test suites                   |
| `config/database.ts`     | The three connections; SQL debug in dev only       |
| `config/auth.ts`         | Guards and 2FA                                     |
| `config/shield.ts`       | CSRF, HSTS, frame options                          |
| `config/inertia.ts`      | Root view, SSR                                     |
| `config/boss.ts`         | pg-boss connection and schema                      |
| `config/server_stats.ts` | Stats toolbar; `authorize` limits it to god admins |
| `start/routes.ts`        | Web routes and route groups                        |
| `start/api/api.ts`       | `/api/v1` routes                                   |
| `start/kernel.ts`        | Middleware stacks and ordering                     |
| `start/extensions.ts`    | Registers request/context macros                   |

Notable environment variables beyond the obvious: `ADMIN_DB`, `DEV_DB`, `PROD_DB`, `APP_URL`, and the optional `HEALTH_CHECK_SECRET`.

## API documentation

`GET /docs` (Scalar; `/docs/1` RapiDoc, `/docs/2` Swagger UI) and `GET /swagger` for the raw spec. Both require an authenticated admin — they describe the entire internal API surface.

## Backups

`pg_dump` runs every 6 hours via pg-boss and streams to Cloudflare R2. Every attempt — successful or not — is recorded in `backup_runs`, which is what the health panel on `/db-backups` and the hourly `backup-health-check` cron read; `db_backups` only ever gets a row when a backup completes.

Restores target a **named** database (`dev` or `prod`) whose connection string comes from the server environment, never from the request. Restoring into production additionally requires a god admin.

Local dump files are a cache — R2 holds the artefact — and are pruned after each run and daily by `prune-local-backups`.

## Health checks

`GET /health` returns liveness only (`{ isHealthy }`) to anonymous callers, so load balancer probes keep working without disclosing internals. The full report — every database connection, disk, memory — requires either a signed-in admin or the `x-monitoring-secret` header matching `HEALTH_CHECK_SECRET`.

## CI

`.github/workflows/ci.yml` runs format check, typecheck, tests and a production build against a PostgreSQL service container on every push and pull request. `npm audit` runs advisory-only.

## Deployment

```bash
npm run build
# set production env vars
node ace migration:run
npm start
```
