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

Create a `.env` file in the project root (copy from `.env.example` if available) and set:

- `DATABASE_URL` - PostgreSQL connection string

### 3. Database Setup

```bash
# Generate migrations from schema changes
npm run db:generate --workspace=packages/database

# Run migrations
npm run db:migrate --workspace=packages/database

# Seed lookup tables
npm run seed --workspace=calendar-service
```

### 4. Run the Application

```bash
npm start
```

This runs:

- Backend API at `http://localhost:3001`
- Frontend UI at `http://localhost:3000`

Run services individually:

```bash
npm run start:dev --workspace=calendar-service  # Backend only
npm run dev --workspace=calendar-ui              # Frontend only
```

## Environment Variables

| Variable             | Description                              | Required | Default               |
| -------------------- | ---------------------------------------- | -------- | --------------------- |
| `DATABASE_URL`       | PostgreSQL connection string             | Yes      | -                     |
| `API_KEY`            | API authentication key (optional in dev) | No       | -                     |
| `PORT`               | Backend service port                     | No       | 3001                  |
| `VITE_API_BASE_URL`  | Frontend API base URL                    | No       | http://localhost:3001 |
| `DB_MAX_CONNECTIONS` | Database connection pool size            | No       | 10                    |
| `DB_IDLE_TIMEOUT`    | Database idle timeout (seconds)          | No       | 20                    |
| `DB_CONNECT_TIMEOUT` | Database connection timeout (seconds)    | No       | 10                    |

**API Authentication**: The API uses API key authentication via the `X-API-Key` header. In development, if `API_KEY` is not set, all requests are allowed. `/health` and `/ready` endpoints are always public.

## Project Structure

```
bcs-marzipan/
├── calendar-service/          # NestJS backend API
│   ├── src/
│   │   ├── activities/        # Activities module (CRUD operations)
│   │   ├── lookups/           # Lookup data endpoints
│   │   ├── database/          # Database module (Drizzle integration)
│   │   ├── commands/          # CLI commands (seed, etc.)
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
│       │   ├── api/           # API type definitions
│       │   └── utils/         # Utility functions
│       └── package.json
├── docs/                      # Additional documentation
│   ├── SCHEMA_README.md       # Schema and type safety documentation
│   ├── DOCKER_DEPLOYMENT.md   # Docker deployment guide
│   └── PRE_COMMIT_HOOKS.md    # Git hooks documentation
└── package.json               # Root workspace configuration
```

## Development Workflow

### Building

```bash
npm run build              # Build all services and packages
npm run build:packages    # Build packages only
```

### Type Checking

```bash
npm run typecheck         # Check all workspaces
npm run typecheck:packages # Check packages only
```

### Database Operations

```bash
npm run db:generate --workspace=packages/database  # Generate migrations
npm run db:migrate --workspace=packages/database    # Run migrations
npm run db:push --workspace=packages/database       # Push schema (dev only)
npm run db:studio --workspace=packages/database      # Open Drizzle Studio
npm run seed --workspace=calendar-service           # Seed lookup tables
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

```typescript
import { db } from '@corpcal/database';
import { activities } from '@corpcal/database/schema';
```

See [packages/database/README.md](packages/database/README.md) for details.

### @corpcal/shared

Shared package containing types, schemas, and utilities.

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

### Build Errors

```bash
npm run build:packages  # Rebuild packages
```

### Dependency Issues

```bash
rm -rf node_modules package-lock.json
rm -rf calendar-service/node_modules calendar-ui/node_modules
rm -rf packages/*/node_modules
npm cache clean --force
npm install
```

### Type Errors

1. Build packages: `npm run build:packages`
2. Run type checking: `npm run typecheck`
3. Validate types: `npm run validate-types --workspace=packages/shared`

## Contributing

### Code Quality

```bash
# Format all code
npm run format

# Check formatting
npm run format:check

# Lint and auto-fix
npm run lint

# Check linting
npm run lint:check
```

### Git Hooks

This project uses **Husky** to enforce code quality. See [Pre-Commit Hooks Documentation](docs/PRE_COMMIT_HOOKS.md) for details.

**Pre-commit hook** (blocking):

- Runs ESLint with auto-fix on staged files
- Runs Prettier on non-code files
- Runs tests for affected files

**Pre-push hook** (blocking):

- Validates full project build
- Runs all test suites
- Validates schema types are in sync
- Validates branch naming convention

**Commit-msg hook** (non-blocking):

- Validates commit message format (Conventional Commits)

## Developer Guide

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <subject>`

- **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `chore`
- **scope**: Optional (e.g., `activities`, `database`)
- **subject**: Short description (max 100 characters)

Examples: `feat(activities): add filtering`, `fix(database): resolve connection issue`

Use `npm run commit` for an interactive prompt.

### Branch Naming

Format: `<type>/CORPCAL-<number>-<short-description>`

- **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `chore`
- **Jira key**: `CORPCAL-<number>` (uppercase)
- **description**: Lowercase, hyphens only

Example: `feat/CORPCAL-123-add-user-authentication`

Protected branches (`main`, `master`, `develop`) skip validation.

For detailed hook documentation, see [Pre-Commit Hooks Documentation](docs/PRE_COMMIT_HOOKS.md).
