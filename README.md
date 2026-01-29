# AdonisJS Starter Template

A modern, full-stack starter template built with AdonisJS and Inertia.js, featuring React, TypeScript, and Tailwind CSS.

## 🚀 What's Included

This starter template provides a solid foundation for building modern web applications with the following features:

### Backend (AdonisJS)

- **Framework**: AdonisJS v6 - A Node.js MVC framework with TypeScript support
- **Database**: Lucid ORM with SQLite (better-sqlite3) - Easily switchable to PostgreSQL, MySQL, etc.
- **Authentication**: Complete authentication system with:
  - User registration
  - Login/logout
  - Password reset functionality
  - Session-based authentication
  - Password reset tokens
- **Email**: Mail service configured with React Email templates
- **Validation**: VineJS for request validation
- **Security**: Shield middleware for CSRF protection
- **Static Assets**: Static file serving configured

### Frontend (React + Inertia.js)

- **Framework**: React 19 with TypeScript
- **SPA Experience**: Inertia.js for seamless single-page app experience without API complexity
- **Server-Side Rendering**: SSR enabled for better SEO and initial load performance
- **Styling**: Tailwind CSS with custom configuration
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Icons**: Lucide React icon library
- **Build Tool**: Vite 6 for fast development and optimized production builds


## 📁 Project Structure

```
starter-template/
├── app/
│   ├── controllers/        # HTTP request handlers
│   │   ├── auth_controller.ts
│   │   └── users_controller.ts
│   ├── middleware/         # HTTP middleware
│   │   ├── auth_middleware.ts
│   │   ├── guest_middleware.ts
│   │   └── silent_auth_middleware.ts
│   ├── models/             # Database models
│   │   ├── user.ts
│   │   └── password_reset.ts
│   ├── services/           # Business logic services
│   │   └── email_service.ts
│   ├── utils/              # Utility functions
│   └── validators/         # Request validators
│       └── auth.ts
├── config/                 # Configuration files
│   ├── auth.ts
│   ├── database.ts
│   ├── inertia.ts
│   └── ...
├── database/
│   └── migrations/         # Database migrations
│       ├── create_users_table.ts
│       ├── create_auth_access_tokens_table.ts
│       └── create_password_resets_table.ts
├── inertia/
│   ├── app/                # Inertia app setup
│   │   ├── app.tsx         # Client-side entry
│   │   └── ssr.tsx        # Server-side rendering
│   ├── pages/              # React page components
│   │   └── home.tsx
│   ├── emails/             # React Email templates
│   └── css/                # Global styles
├── resources/
│   ├── js/                 # Additional JavaScript/TypeScript
│   ├── css/                # CSS files
│   └── views/              # Edge templates
│       └── inertia_layout.edge
├── start/
│   ├── routes.ts           # Application routes
│   ├── kernel.ts          # Middleware configuration
│   ├── health.ts          # Health check configuration
│   └── env.ts             # Environment variable validation
└── tests/                  # Test files
    ├── bootstrap.ts        # Test configuration
    ├── functional/         # Functional/integration tests
    │   ├── auth.spec.ts   # Authentication tests
    │   └── health.spec.ts # Health check tests
    └── unit/              # Unit tests
        └── user.spec.ts   # User model tests

```

## 🛠️ Getting Started

### Prerequisites

- Node.js 22+ 
- npm 10+

### Quick Setup (Recommended)

The easiest way to get started is using the provided setup script:

**On macOS/Linux:**
```bash
# Make the script executable (if needed)
chmod +x setup.sh

# Run the setup script
./setup.sh
```

After running the setup script, start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3333`

### Manual Installation

If you prefer to set up manually:

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Generate the application key:
```bash
node ace generate:key
```

4. Run database migrations:
```bash
node ace migration:run
```

5. (Optional) Seed the database with sample users:
```bash
node ace db:seed
```

6. Start the development server:
```bash
npm run dev
``` 


### Features

- **User Registration** - Sign up with email and password
- **Login/Logout** - Session-based authentication with remember me support
- **Password Reset** - Forgot password flow with email tokens
- **Session Management** - Secure session handling with CSRF protection
- **Password Security** - Automatic password hashing using scrypt

### Authentication Details

- **Session-based authentication** using AdonisJS session guards
- **Password hashing** handled automatically via Lucid ORM hooks
- **CSRF protection** enabled for all POST/PUT/PATCH/DELETE requests
- **Remember me tokens** supported for persistent sessions
- **Password reset tokens** expire after 1 hour

All authentication endpoints are prefixed with `/api/v1/auth`. See the API documentation at `/docs` for detailed endpoint specifications.



## 📧 Email Templates

Email templates are built with React Email and located in `inertia/emails/`. The email service is configured in `app/services/email_service.ts`.

## 🗄️ Database

The project uses SQLite by default (configured in `config/database.ts`). To switch to another database:

1. Install the appropriate driver (e.g., `pg` for PostgreSQL)
2. Update `config/database.ts` with your connection details
3. Update `.env` with your database credentials

## 🧪 Testing

This project includes comprehensive test coverage using Japa test runner with AdonisJS testing utilities.

### Test Suites

Tests are organized into two suites:

- **Unit tests** (`tests/unit/`) - Fast, isolated tests for individual components
  - User model tests (password hashing, credential verification)
  - Utility function tests
  
- **Functional tests** (`tests/functional/`) - Integration tests with HTTP requests
  - Authentication endpoints (signup, login, logout, password reset)
  - Health check endpoints
  - Full request/response cycle testing

### Running Tests

Run all tests:
```bash
npm test
```


## 📚 API Documentation

The project includes automatic API documentation using Swagger:
- **API Docs UI**: `GET /docs` - Interactive API documentation (RapiDoc)

The Swagger configuration is in `config/swagger.ts`. API documentation is automatically generated from your routes and can be customized with additional metadata.

## 🔧 Configuration

Key configuration files:
- `config/auth.ts` - Authentication settings
- `config/database.ts` - Database connections
- `config/inertia.ts` - Inertia.js settings
- `config/mail.ts` - Email configuration
- `config/shield.ts` - Security middleware (CSRF, CSP, etc.)
- `config/session.ts` - Session configuration
- `adonisrc.ts` - AdonisJS application configuration
- `.env.test` - Test environment variables


## 🚀 Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Run migrations:
```bash
node ace migration:run
```

4. Start the server:
```bash
npm start
```

## 📄 License

UNLICENSED

## 📄 Google OAuth2 Setup
[YouTube Video](https://www.youtube.com/shorts/WABhO9KsOpU)

To setup Google OAuth2, you need to:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)  
2. Create or have a new project in the Google Cloud Console
2. Open the side bar and select "API & Services"
4. Select Credentials and then OAuth Consent Screen
5. Click data acess in the sidebar, click add or remove scopes and then select the first 2 scopes
6. Create a new client ID and client secret and copy the client ID and client secret to the `.env` file
7. Set the redirect URI to `http://localhost:3333/google/callback`. This should match the callback URL in the `.env` and ally.ts file file
8. In production, don't forget to set the callback URL to the production URL and the client ID and client secret to the production values and publish the app in the audience tab.





