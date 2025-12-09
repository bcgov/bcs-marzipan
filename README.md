# Corporate Calendar Application

A full-stack application for managing corporate calendar activities, built with NestJS (backend) and React (frontend) in a monorepo structure.

## Project Overview

This application provides a comprehensive system for managing calendar activities, including event scheduling, approvals, communications, and reporting. The system supports multiple organizations, government representatives, and various activity types with rich metadata and workflow management.

## Architecture

This is a monorepo workspace containing:

- **calendar-service**: NestJS backend API service
- **calendar-ui**: React frontend application (Vite)
- **packages/database**: Drizzle ORM schemas and database client
- **packages/shared**: Shared types, schemas, DTOs, and utilities

The workspace uses npm workspaces to manage dependencies across packages. Internal packages (`@corpcal/database` and `@corpcal/shared`) are referenced as workspace dependencies.

## Prerequisites

- **Node.js**: >= 24.0.0
- **npm**: >= 11.0.0
- **PostgreSQL**: Database server (version 12+)
- **Docker** (optional): For containerized development

## Quick Start

### 1. Install Dependencies

From the project root:

```bash
npm install
```

This installs dependencies for all workspaces (root, calendar-service, calendar-ui, and packages).

### 2. Environment Setup

Create a `.env` file in the project root (see [Environment Variables](#environment-variables) section or copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `DATABASE_URL` - PostgreSQL connection string

### 3. Database Setup

Set up the database schema:

```bash
# Generate migrations from schema changes
npm run db:generate --workspace=packages/database

# Run migrations
npm run db:migrate --workspace=packages/database

# Seed lookup tables
npm run seed --workspace=calendar-service
```

### 4. Run the Application

Start both services in development mode:

```bash
npm start
```

This runs:

- Backend API at `http://localhost:3001`
- Frontend UI at `http://localhost:3000` (Vite dev server)

Alternatively, run services individually:

```bash
# Backend only
npm run start:dev --workspace=calendar-service

# Frontend only
npm run dev --workspace=calendar-ui
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable             | Description                              | Required | Default               |
| -------------------- | ---------------------------------------- | -------- | --------------------- |
| `DATABASE_URL`       | PostgreSQL connection string             | Yes      | -                     |
| `API_KEY`            | API authentication key (optional in dev) | No       | -                     |
| `PORT`               | Backend service port                     | No       | 3001                  |
| `VITE_API_BASE_URL`  | Frontend API base URL                    | No       | http://localhost:3001 |
| `DB_MAX_CONNECTIONS` | Database connection pool size            | No       | 10                    |
| `DB_IDLE_TIMEOUT`    | Database idle timeout (seconds)          | No       | 20                    |
| `DB_CONNECT_TIMEOUT` | Database connection timeout (seconds)    | No       | 10                    |

See `.env.example` for a template with all available variables.

### API Authentication

The API uses API key authentication via the `X-API-Key` header:

- **Development**: If `API_KEY` is not set, all requests are allowed (except health/readiness endpoints are always public)
- **Production**: `API_KEY` must be set and all requests require a valid `X-API-Key` header
- **Public Endpoints**: `/health` and `/ready` endpoints do not require authentication

Example API request:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3001/activities
```

## Project Structure

```
bcs-marzipan/
├── calendar-service/          # NestJS backend API
│   ├── src/
│   │   ├── activities/        # Activities module (CRUD operations)
│   │   ├── lookups/           # Lookup data endpoints
│   │   ├── database/          # Database module (Drizzle integration)
│   │   ├── auth/              # Authentication guards
│   │   └── common/            # Shared utilities, pipes, interceptors
│   └── package.json
├── calendar-ui/               # React frontend (Vite)
│   ├── src/
│   │   ├── api/               # API client functions
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   └── schemas/           # Form validation schemas
│   └── package.json
├── packages/
│   ├── database/              # Database package
│   │   ├── src/
│   │   │   ├── schema/        # Drizzle ORM schema definitions
│   │   │   └── client.ts      # Database client setup
│   │   └── migrations/        # Database migration files
│   └── shared/                # Shared package
│       ├── src/
│       │   ├── schemas/       # Zod validation schemas
│       │   ├── dto/           # Data Transfer Objects
│       │   ├── api/           # API type definitions
│       │   └── utils/         # Utility functions
│       └── package.json
├── docs/                      # Additional documentation
│   ├── SCHEMA_README.md       # Schema and type safety documentation
│   └── DOCKER_DEPLOYMENT.md   # Docker deployment guide
└── package.json               # Root workspace configuration
```

## Development Workflow

### Building Packages

Workspace packages must be built before the services can use them:

```bash
# Build all packages
npm run build:packages

# Build specific package
npm run build --workspace=packages/database
npm run build --workspace=packages/shared
```

### Building Services

Build all services and packages:

```bash
npm run build
```

This builds packages first, then the services.

### Type Checking

Type check all workspaces:

```bash
npm run typecheck
```

Type check packages only:

```bash
npm run typecheck:packages
```

### Database Operations

```bash
# Generate migrations from schema changes
npm run db:generate --workspace=packages/database

# Run migrations
npm run db:migrate --workspace=packages/database

# Push schema directly (development only - bypasses migrations)
npm run db:push --workspace=packages/database

# Open Drizzle Studio (database GUI)
npm run db:studio --workspace=packages/database

# Seed lookup tables
npm run seed --workspace=calendar-service
```

### Code Quality

```bash
# Format all code
npm run format

# Check formatting
npm run format:check

# Lint and auto-fix
npm run lint

# Lint check only
npm run lint:check
```

## API Documentation

The API includes Swagger/OpenAPI documentation. When the backend is running, access the interactive API documentation at:

```
http://localhost:3001/api
```

The API provides endpoints for:

- **Activities**: CRUD operations for calendar activities
- **Lookups**: Reference data (categories, organizations, users, tags, etc.)
- **Health**: Health check and readiness probes

## Monorepo Packages

### @corpcal/database

Database package containing Drizzle ORM schemas and database client.

**Usage:**

```typescript
import { db } from '@corpcal/database';
import { activities } from '@corpcal/database/schema';
```

See [packages/database/README.md](packages/database/README.md) for details.

### @corpcal/shared

Shared package containing types, schemas, DTOs, and utilities used by both frontend and backend.

**Exports:**

- `@corpcal/shared/schemas` - Zod validation schemas
- `@corpcal/shared/api/types` - API type definitions (for frontend)
- `@corpcal/shared/dto` - Data Transfer Objects

**Usage:**

```typescript
import type { ActivityResponse } from '@corpcal/shared/api/types';
import { createActivityRequestSchema } from '@corpcal/shared/schemas';
```

## Additional Documentation

- **[Schema Documentation](docs/SCHEMA_README.md)**: Detailed information about schema flow, type safety, and how to update schemas
- **[Docker Deployment](docs/DOCKER_DEPLOYMENT.md)**: Guide for Docker and docker-compose usage
- **[Database Module](calendar-service/src/database/README.md)**: Database module usage in NestJS services
- **[Database Package](packages/database/README.md)**: Database package setup and usage

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001

# Kill process (replace PID)
kill -9 <PID>
```

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly in `.env`
- Ensure PostgreSQL is running
- Check database credentials and network access
- Test connection: `npm run test:db --workspace=calendar-service`

### Build Errors

If packages fail to build:

```bash
# Clean and rebuild
npm run clean --workspace=packages/database
npm run clean --workspace=packages/shared
npm run build:packages
```

### Dependency Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf calendar-service/node_modules calendar-ui/node_modules
rm -rf packages/*/node_modules
npm cache clean --force
npm install
```

### Type Errors

If TypeScript errors occur:

1. Ensure packages are built: `npm run build:packages`
2. Run type checking: `npm run typecheck`
3. Validate types: `npm run validate-types --workspace=packages/shared`

## Contributing

### Code Formatting

This project uses **Prettier** for code formatting and **ESLint** for code quality checks.

#### VS Code Users

The project includes workspace settings that automatically format code on save. Make sure you have the [Prettier VS Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) installed.

#### Manual Formatting

```bash
# Format all code
npm run format

# Check formatting without modifying files
npm run format:check

# Lint and auto-fix issues
npm run lint

# Check linting without auto-fixing
npm run lint:check
```

### Pre-commit Hooks

This project uses **Husky** to run pre-commit checks. When you commit code, the hook will:

1. Auto-fix linting issues where possible
2. Check for type errors (currently only runs in ~/packages)
3. Check code formatting (non-blocking)

The hooks are currently **non-blocking**, meaning they will show warnings but won't prevent commits. This allows you to see issues and fix them while still being able to commit during active development.

#### Skipping Hooks

If you need to skip pre-commit checks (e.g., for WIP commits), use:

```bash
git commit --no-verify -m "your message"
```

**Note:** It's generally recommended to let the hooks run since they auto-fix many issues and provide useful feedback.
