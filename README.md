# Togetha Admin

The admin app for [Togetha](https://togetha.co.uk) — property and tenancy management for landlords, agencies, and tenants. Built with AdonisJS and Inertia.js, featuring React, TypeScript, and Tailwind CSS. Includes dashboard analytics, customer (org) management with multi-step creation, leases, properties, teams, push notifications, backups, blog management, and full authentication.

## What's Included

### Backend (AdonisJS)

- **Framework**: AdonisJS v6 with TypeScript
- **Database**: Lucid ORM (SQLite by default; switchable to PostgreSQL, etc.)
- **Authentication**: Registration, login/logout, password reset, session-based auth, two-factor auth, Google OAuth2
- **Validation**: VineJS validators (e.g. `createCustomerUserValidator` for org creation)
- **Email**: React Email templates
- **Security**: Shield (CSRF, CSP), session handling

### Frontend (React + Inertia.js)

- **Stack**: React 19, TypeScript, Inertia.js, Vite 6
- **Styling**: Tailwind CSS
- **UI**: shadcn-style components (Base UI primitives), Lucide icons
- **Forms**: Formik + Yup for multi-step flows (e.g. create customer)
- **Charts**: Recharts (dashboard growth charts)
- **Data**: TanStack Query for API data

### Main Features

- **Dashboard** – Stats (users, tenancies, activity), growth charts (new users, new tenancies, activity per week), recent activity table
- **Customers (Orgs)** – List with stats, create flow with stepper (Details → Plan & Features → Summary), detail view with tabs (Details, Leases, Properties, Activities)
- **Leases** – List and detail with tabs (payments, activity, status)
- **Properties** – List and detail with tabs (leases, activity)
- **Teams** – Team management and invitations
- **Push notifications** – OneSignal integration; send to all users, landlords, tenants, or agencies; schedule or send now (title, description, image, URL)
- **Backups** – Database backup list and create
- **Blog** – Public blog and manage (posts, categories, tags, authors)
- **Settings** – Profile, password, notifications, sessions, two-factor auth, delete account

## Project Structure

```
app/
├── controllers/          # HTTP handlers (auth, dashboard, orgs, leases, push notifications, db backups, etc.)
├── middleware/
├── models/               # Lucid models (User, Org, Lease, PushNotification, DbBackup, etc.)
├── services/             # OrgService, StripeService, OneSignalService, etc.
├── validators/           # Vine validators (auth, org, blog, team, user, push notification)
├── utils/
└── types/

inertia/
├── app/                  # Inertia + React app entry
├── components/           # Shared UI (dashboard layout, data-table, stepper, radio-group, etc.)
├── pages/                # Route pages (dashboard, orgs, leases, properties, teams, push-notifications, db-backups, blog, settings)
├── emails/               # React Email templates
├── hooks/
├── lib/
└── utils/

config/                   # Auth, database, inertia, mail, shield, etc.
database/                 # Migrations
start/
├── routes.ts             # Web + API routes
├── kernel.ts
└── api/                  # API route definitions
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Quick Setup

```bash
chmod +x setup.sh
./setup.sh
npm run dev
```

App: `http://localhost:3333`

### Manual Setup

1. **Install & env**
   ```bash
   npm install
   cp .env.example .env
   node ace generate:key
   ```

2. **Database**
   ```bash
   node ace migration:run
   # Optional: node ace db:seed
   ```

3. **Run**
   ```bash
   npm run dev
   ```

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start dev server with HMR      |
| `npm run build`| Production build               |
| `npm start`    | Run production server          |
| `npm test`     | Run tests (Japa)               |
| `npm run typecheck` | TypeScript check         |
| `npm run format`    | Biome format              |
| `npm run refresh`  | Refresh route types       |

## Database

Default: SQLite (`config/database.ts`). To use PostgreSQL (or another driver):

1. Install the driver (e.g. `pg`).
2. Update `config/database.ts` and `.env`.

## Push Notifications (OneSignal)

Set `ONESIGNAL_APP_ID`, `ONESIGNAL_API_ENDPOINT`, and `ONESIGNAL_API_KEY` in `.env`. To send scheduled push notifications, run the scheduler every minute, e.g.:

```bash
* * * * * cd /path/to/app && node ace push:send-scheduled
```

## Testing

- **Unit**: `tests/unit/` (e.g. user model)
- **Functional**: `tests/functional/` (auth, health)

```bash
npm test
```

## API Documentation

- **Docs UI**: `GET /docs` (RapiDoc)
- Config: `config/swagger.ts`

## Configuration

- `config/auth.ts` – Auth guards, 2FA
- `config/database.ts` – DB connections
- `config/inertia.ts` – Inertia/SSR
- `config/mail.ts` – Mail
- `config/shield.ts` – CSRF, CSP
- `config/session.ts` – Session
- `adonisrc.ts` – App config

## Deployment

1. `npm run build`
2. Set production env vars
3. `node ace migration:run`
4. `npm start`
