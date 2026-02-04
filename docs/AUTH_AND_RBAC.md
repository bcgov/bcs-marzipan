# Authentication and Role-Based Access Control (RBAC)

This document describes the authentication and authorization system implemented in the Corporate Calendar application. The system supports JWT-based authentication with mock auth for development and extensible AD integration for production.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (calendar-ui)                         │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────┐                 │
│  │ AuthContext │  │ usePermissions() │  │ PermissionGate │  [FUTURE]       │
│  └─────────────┘  └──────────────────┘  └────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Backend (calendar-service)                       │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │      auth/ Module           │  │        policy/ Module               │  │
│  │  ┌───────────────────────┐  │  │  ┌─────────────────────────────┐   │  │
│  │  │ AuthController        │  │  │  │ PolicyService               │   │  │
│  │  │ - POST /auth/login    │  │  │  │ - getPermissionsForRole()   │   │  │
│  │  │ - GET  /auth/me       │  │  │  │ - getTeamIdsForUser()       │   │  │
│  │  │ - POST /auth/logout   │  │  │  │ - hasPermission()           │   │  │
│  │  │ - POST /auth/refresh  │  │  │  │ - bypassesDataScoping()     │   │  │
│  │  └───────────────────────┘  │  │  └─────────────────────────────┘   │  │
│  │  ┌───────────────────────┐  │  │  ┌─────────────────────────────┐   │  │
│  │  │ AuthService           │  │  │  │ Guards                      │   │  │
│  │  │ - login()             │  │  │  │ - PermissionsGuard          │   │  │
│  │  │ - validatePayload()   │  │  │  │ - RolesGuard                │   │  │
│  │  │ - logout()            │  │  │  └─────────────────────────────┘   │  │
│  │  └───────────────────────┘  │  │  ┌─────────────────────────────┐   │  │
│  │  ┌───────────────────────┐  │  │  │ Decorators                  │   │  │
│  │  │ JwtAuthGuard          │  │  │  │ - @RequirePermission        │   │  │
│  │  │ - Validates JWT       │  │  │  │ - @RequireAnyPermission     │   │  │
│  │  │ - Sets request.user   │  │  │  │ - @RequireRole              │   │  │
│  │  └───────────────────────┘  │  │  └─────────────────────────────┘   │  │
│  │  ┌───────────────────────┐  │  │  ┌─────────────────────────────┐   │  │
│  │  │ Strategies            │  │  │  │ DataScopeInterceptor        │   │  │
│  │  │ - mock.strategy.ts    │  │  │  │ - Sets request.dataScope    │   │  │
│  │  │ - ad.strategy.ts      │  │  │  └─────────────────────────────┘   │  │
│  │  └───────────────────────┘  │  │                                     │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Database (packages/database)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │   users     │ │   roles     │ │   permissions    │ │ role_permissions │ │
│  └─────────────┘ └─────────────┘ └──────────────────┘ └──────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐                                           │
│  │  sessions   │ │ user_teams  │                                           │
│  └─────────────┘ └─────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

Configure authentication in your `.env` file:

```bash
# Authentication strategy: 'mock' for development, 'ad' for Active Directory
AUTH_STRATEGY=mock

# JWT secret key (required in production - use a strong random value)
JWT_SECRET=your-jwt-secret-change-in-production

# JWT token expiration in seconds (default: 3600 = 1 hour)
JWT_EXPIRES_IN=3600
```

### Token content and policy changes

The JWT embeds the user's **permissions** and **teamIds** at login time. As a result:

- **Role or permission changes** (e.g. editing a user's role in the database) do not take effect until the user logs in again or the token expires.
- **Team membership changes** (e.g. adding or removing the user from teams) also do not take effect until the next login or token expiry.

A default TTL of one hour (3600 seconds) is a reasonable balance between security and usability. For environments where near-real-time enforcement of role or team changes is required, consider:

- Using a **shorter TTL** so that tokens expire sooner and users must re-authenticate.
- Implementing **refresh tokens** plus **revocation** (e.g. using the existing `sessions` table to invalidate tokens or track active sessions), so that permission or team changes can be enforced on the next refresh or request.

This document does not describe refresh or revocation implementation; the above is guidance for future work.

## System Roles

The system includes 5 predefined roles with hierarchical capabilities:

| Role         | ID  | Description                                                 |
| ------------ | --- | ----------------------------------------------------------- |
| View Only    | 1   | Read-only access to view data                               |
| Editor       | 2   | Can create and edit activities and drafts                   |
| Advanced     | 3   | Editor + approve activities and export reports              |
| Admin        | 4   | Full admin access including delete, publish, users, teams   |
| System Admin | 5   | Complete system access including role/permission management |

### Role Capabilities Matrix

| Permission                | View Only | Editor | Advanced | Admin | System Admin |
| ------------------------- | --------- | ------ | -------- | ----- | ------------ |
| activities.view           | x         | x      | x        | x     | x            |
| activities.create         |           | x      | x        | x     | x            |
| activities.edit           |           | x      | x        | x     | x            |
| activities.delete         |           |        |          | x     | x            |
| activities.approve        |           |        | x        | x     | x            |
| activities.publish        |           |        |          | x     | x            |
| activities.unpublish      |           |        |          | x     | x            |
| drafts.view               | x         | x      | x        | x     | x            |
| drafts.create             |           | x      | x        | x     | x            |
| drafts.edit               |           | x      | x        | x     | x            |
| drafts.delete             |           | x      | x        | x     | x            |
| drafts.recover            |           |        | x        | x     | x            |
| reports.view              | x         | x      | x        | x     | x            |
| reports.export            |           |        | x        | x     | x            |
| reports.create_custom     |           |        |          | x     | x            |
| lookups.view              | x         | x      | x        | x     | x            |
| lookups.manage            |           |        |          | x     | x            |
| users.view                |           |        |          | x     | x            |
| users.create              |           |        |          |       | x            |
| users.edit                |           |        |          | x     | x            |
| users.delete              |           |        |          |       | x            |
| users.manage_roles        |           |        |          |       | x            |
| teams.view                |           |        |          | x     | x            |
| teams.create              |           |        |          | x     | x            |
| teams.edit                |           |        |          | x     | x            |
| teams.delete              |           |        |          | x     | x            |
| settings.view             |           |        |          | x     | x            |
| settings.manage           |           |        |          | x     | x            |
| system.view_logs          |           |        |          |       | x            |
| system.manage_permissions |           |        |          |       | x            |

## Database Schema

### Roles Table

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Permissions Table

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  key VARCHAR(200) NOT NULL UNIQUE,  -- e.g., 'activities.create' or 'activities.budget.edit'
  display_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  description TEXT,
  resource VARCHAR(100),             -- e.g., 'activities' (optional, extracted from key)
  action VARCHAR(50),                -- e.g., 'create' (optional, extracted from key)
  scope VARCHAR(100),                 -- e.g., 'budget', 'filter.dateRange' (optional, for resource.scope.action format)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**Key Format:** Supports multiple patterns:

- `resource.action` (e.g., `activities.create`, `reports.export`)
- `resource.scope.action` (e.g., `activities.budget.edit`, `activities.filter.dateRange.view`, `reports.custom.export`)

The `key` is the source of truth. `resource`, `scope`, and `action` are denormalized fields for query convenience and may be null for non-standard key formats.

### Role Permissions Table

```sql
CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);
```

### Sessions Table

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### User Teams Table

```sql
CREATE TABLE user_teams (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, team_id)
);
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint      | Description                     | Auth Required |
| ------ | ------------- | ------------------------------- | ------------- |
| POST   | /auth/login   | Login with username             | No            |
| GET    | /auth/me      | Get current user & permissions  | Yes           |
| POST   | /auth/logout  | Log out (client discards token) | Yes           |
| POST   | /auth/refresh | Refresh token (not implemented) | Yes           |

### Login Request/Response

**Request:**

```json
POST /auth/login
Content-Type: application/json

{
  "username": "john.doe"
}
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "username": "john.doe",
    "displayName": "John Doe",
    "email": "john.doe@gov.bc.ca",
    "roleId": 4,
    "roleName": "Admin",
    "permissions": [
      "activities.view",
      "activities.create",
      "activities.edit",
      "activities.delete",
      ...
    ],
    "teamIds": [1, 2]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Using the JWT Token

Include the token in the `Authorization` header for authenticated requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## JWT Payload Structure

The JWT token contains all necessary user context:

```typescript
interface JwtPayload {
  sub: number; // User ID
  username: string; // AD username
  displayName: string; // Display name
  email: string; // Email address
  roleId: number; // Role ID
  roleName: string; // Role name
  permissions: string[]; // Permission keys
  teamIds: number[]; // Team memberships
}
```

## Backend Usage

### Protecting Endpoints with Permissions

```typescript
import { RequirePermission, RequireAnyPermission } from '../policy/decorators/require-permission.decorator';
import { PERMISSIONS } from '@corpcal/shared';

@Controller('activities')
export class ActivitiesController {

  // Require a single permission
  @RequirePermission(PERMISSIONS.ACTIVITIES.VIEW)
  @Get()
  findAll() { ... }

  // Require any of the listed permissions
  @RequireAnyPermission(
    PERMISSIONS.ACTIVITIES.CREATE,
    PERMISSIONS.ACTIVITIES.EDIT
  )
  @Post()
  create(@Body() body: CreateActivityDto) { ... }

  // Require all listed permissions
  @RequireAllPermissions(
    PERMISSIONS.ACTIVITIES.DELETE,
    PERMISSIONS.ACTIVITIES.APPROVE
  )
  @Delete(':id')
  remove(@Param('id') id: number) { ... }
}
```

### Protecting Endpoints with Roles

```typescript
import { RequireRole } from '../policy/decorators/require-role.decorator';
import { SYSTEM_ROLES } from '@corpcal/shared';

@Controller('admin')
export class AdminController {

  // Allow Admin or System Admin
  @RequireRole(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SYSTEM_ADMIN)
  @Get('users')
  listUsers() { ... }
}
```

### Accessing Current User

```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '@corpcal/shared';

@Controller('activities')
export class ActivitiesController {
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    // user.id, user.roleName, user.permissions, user.teamIds available
    return this.service.findByUser(user.id);
  }

  // Access specific user property
  @Get('my-id')
  getMyId(@CurrentUser('id') userId: number) {
    return { userId };
  }
}
```

### Making Endpoints Public

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
```

### Data Scoping

The `DataScopeInterceptor` automatically sets `request.dataScope` with team-based filtering information:

```typescript
interface DataScope {
  teamIds: number[]; // User's team IDs (empty if bypass)
  bypass: boolean; // true for Advanced/Admin/System Admin
}
```

Services can use this for filtering:

```typescript
@Injectable()
export class ActivitiesService {
  async findAll(dataScope: DataScope) {
    if (dataScope.bypass) {
      // Advanced/Admin/System Admin - return all activities
      return this.db.select().from(activities);
    }

    // Filter by user's teams
    return this.db
      .select()
      .from(activities)
      .where(inArray(activities.teamId, dataScope.teamIds));
  }
}
```

## Shared Types (packages/shared/src/auth/)

### AuthUser Interface

```typescript
export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  teamIds: number[];
}
```

### Permission Constants

```typescript
export const PERMISSIONS = {
  ACTIVITIES: {
    VIEW: 'activities.view',
    CREATE: 'activities.create',
    EDIT: 'activities.edit',
    DELETE: 'activities.delete',
    APPROVE: 'activities.approve',
    PUBLISH: 'activities.publish',
    UNPUBLISH: 'activities.unpublish',
  },
  DRAFTS: {
    VIEW: 'drafts.view',
    CREATE: 'drafts.create',
    EDIT: 'drafts.edit',
    DELETE: 'drafts.delete',
    RECOVER: 'drafts.recover',
  },
  // ... other categories
} as const;
```

### System Role Constants

```typescript
export const SYSTEM_ROLES = {
  VIEW_ONLY: 'View Only',
  EDITOR: 'Editor',
  ADVANCED: 'Advanced',
  ADMIN: 'Admin',
  SYSTEM_ADMIN: 'System Admin',
} as const;
```

## Mock Authentication (Development)

For development, use `AUTH_STRATEGY=mock`. Login with any seeded username:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john.doe"}'
```

### Seeded Mock Users

| Username      | Role      | Teams |
| ------------- | --------- | ----- |
| john.doe      | Admin     | -     |
| jane.smith    | Editor    | -     |
| sam.wilson    | Editor    | -     |
| david.chen    | Editor    | -     |
| emily.wang    | View Only | -     |
| michael.brown | View Only | -     |

## Active Directory Integration (Production)

> **Note:** AD integration is a placeholder for future implementation.

When `AUTH_STRATEGY=ad`:

1. User credentials are validated against Active Directory
2. If valid, local user record is created/updated with AD profile data
3. JWT is issued with user context
4. AD groups can be mapped to application roles

The `ad.strategy.ts` file provides the extension point for AD integration.

## Security Considerations

1. **JWT Secret**: Use a strong, random secret in production (min 32 characters)
2. **Token Expiration**: Default 1 hour - adjust based on security requirements
3. **HTTPS**: Always use HTTPS in production to protect tokens in transit
4. **Token Storage**: Store tokens securely (memory preferred over localStorage)
5. **Refresh Tokens**: Not yet implemented - users must re-login on token expiry

## Migration from Legacy

The legacy system used:

- `[calendar].[Role]` table with simple role definitions
- `[calendar].[SystemUser]` table with `RoleId` FK
- `[calendar].[SystemUserMinistry]` for user-ministry associations

The new system provides:

- Granular permissions at resource.action level
- Role-permission mappings for flexible access control
- Team-based data scoping (replaces ministry-based)
- Session management for token invalidation
- JWT-based stateless authentication

See [SCHEMA_MAPPING.md](../packages/database/src/schema/docs/SCHEMA_MAPPING.md) for detailed field mappings.

## Future Work

1. **Frontend Auth Integration**: AuthContext, usePermissions hook, ProtectedRoute, PermissionGate components
2. **AD Integration**: Complete Active Directory authentication strategy
3. **Token Refresh**: Implement refresh token flow
4. **Admin UI**: Role and permission management interface
5. **Audit Logging**: Track authentication and authorization events
