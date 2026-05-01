# Authentication and Role-Based Access Control (RBAC)

This document describes the authentication and authorization system implemented in the Corporate Calendar application. The system supports JWT-based authentication with mock auth for development, local email/password auth, and Azure AD (OIDC) for production.

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
# Authentication strategy: 'mock' for development, 'local' for email+password,
# 'azure' for OIDC (Azure AD / IDIR). Default: 'mock'
AUTH_STRATEGY=mock

# Enable local (email+password) auth alongside another primary strategy.
# Set to 'true' when AUTH_STRATEGY is 'azure' and you also want the local
# login form available (e.g. for admin or break-glass accounts).
LOCAL_AUTH_ENABLED=false

# Azure AD settings (required when AUTH_STRATEGY=azure)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-client-id
AZURE_CLIENT_SECRET=your-app-client-secret

# Optional callback override; if omitted, callback is derived from request host
AZURE_REDIRECT_URI=

# Optional cookie domain for proxy-based deployments. Use the public UI host,
# not the internal calendar-service host, when auth flows through /api.
AUTH_COOKIE_DOMAIN=

# Optional post-login redirect URL. Use the public UI host or a UI route.
POST_LOGIN_REDIRECT_URL=

# JWT secret key (required in production - use a strong random value)
JWT_SECRET=your-jwt-secret-change-in-production

# JWT token expiration in seconds (default: 3600 = 1 hour)
JWT_EXPIRES_IN=3600
```

When the UI proxies backend requests through `/api`, the auth cookie should be
scoped to the public UI hostname, for example
`calendar-ui-d8b00f-dev.apps.silver.devops.gov.bc.ca`. Do not set the cookie
domain to the backend service hostname, because the browser does not navigate to
that host directly during normal app use.

If Azure sign-in should land on a specific UI page after the callback, set
`POST_LOGIN_REDIRECT_URL` to the public UI URL, for example
`https://calendar-ui-d8b00f-dev.apps.silver.devops.gov.bc.ca/`. If left blank,
the backend redirects to `/` after successful sign-in.

For OpenShift deployments, treat `AUTH_COOKIE_DOMAIN` and
`POST_LOGIN_REDIRECT_URL` as environment-specific values. They should be
supplied at deploy time rather than hardcoded into the base manifests so dev,
staging, and prod can each use their own public UI hostname.

### Token content and policy changes

The JWT embeds the user's **permissions** and **teamIds** at login time. As a result:

- **Role or permission changes** (e.g. editing a user's role in the database) do not take effect until the user logs in again or the token expires.
- **Team membership changes** (e.g. adding or removing the user from teams) also do not take effect until the next login or token expiry.

A default TTL of one hour (3600 seconds) is a reasonable balance between security and usability. For environments where near-real-time enforcement of role or team changes is required, consider:

- Using a **shorter TTL** so that tokens expire sooner and users must re-authenticate.
- Implementing **refresh tokens** plus **revocation** (e.g. using the existing `sessions` table to invalidate tokens or track active sessions), so that permission or team changes can be enforced on the next refresh or request.

This document does not describe refresh or revocation implementation; the above is guidance for future work.

### Effective permissions and team roles

At login, the backend computes **effective permissions** as the union of (1) the user's role permissions, (2) the permissions of each team the user belongs to (via `teams.role_id`), and (3) any permissions granted directly to those teams via `team_permissions`. The JWT stores this effective list and a **bypassDataScoping** flag. Bypass is true if the user's role or any of the user's team roles are Advanced Viewer, Advanced Editor, Admin, or System Admin (relaxed: one bypass role grants see-all). The DataScopeInterceptor uses `user.bypassDataScoping` to set `request.dataScope.bypass`. Create and delete are scoped when the user lacks `activities.create.any` or `activities.delete.any`: create requires the activity's lead team to be one of the user's teams (or, with `activities.create.any`, any team whose role has `activities.create`); delete requires the user to be a comms contact or member of the lead team for the activity (or have `activities.delete.any`).

## System Roles

The system includes six predefined roles. Teams may optionally have a role (`teams.role_id`); members receive that role's permissions in addition to their user role (effective permissions = union of user role permissions, all team role permissions, and team_permissions). Data-scoping bypass is relaxed: if the user's role or any of the user's team roles bypass (Advanced Viewer, Advanced Editor, Admin, System Admin), the user sees all activities.

| Role            | ID  | Description                                                                      |
| --------------- | --- | -------------------------------------------------------------------------------- |
| Viewer          | 1   | Read-only access; view data scoped to own teams                                  |
| Editor          | 2   | Create, edit, delete activities and drafts (scoped to own teams)                 |
| Advanced Viewer | 3   | View any team's activities; no create, edit, or delete                           |
| Advanced Editor | 4   | View any team; edit any; create/delete only own team; approve, export, recover   |
| Admin           | 5   | Full admin: create/delete any team's activities, users, teams, lookups, settings |
| System Admin    | 6   | Complete system access including role/permission management                      |

### Role Capabilities Matrix

| Permission                            | Viewer | Editor | Adv Viewer | Adv Editor  | Admin       | Sys Admin |
| ------------------------------------- | ------ | ------ | ---------- | ----------- | ----------- | --------- |
| activities.view                       | x      | x      | x          | x           | x           | x         |
| activities.create                     |        | x      |            | x           | x           | x         |
| activities.create.any                 |        |        |            |             | x           | x         |
| activities.edit                       |        | x      |            | x           | x           | x         |
| activities.delete                     |        | x      |            | x           | x           | x         |
| activities.delete.any                 |        |        |            |             | x           | x         |
| activities.approve                    |        |        |            | x           | x           | x         |
| activities.review                     |        |        |            |             | x           | x         |
| activities.publish                    |        |        |            |             | x           | x         |
| activities.unpublish                  |        |        |            |             | x           | x         |
| activities.lock.forceHandoff          |        |        |            |             | x           | x         |
| drafts.\*                             | view   | all    | view       | all+recover | all         | all       |
| reports.view/export                   | view   | view   | view       | view+export | all         | all       |
| reports.create_custom                 |        |        |            |             | x           | x         |
| lookups.view/manage                   | view   | view   | view       | view        | view+manage | all       |
| users.\* (except manage_roles/delete) |        |        |            |             | x           | x         |
| users.delete, manage_roles            |        |        |            |             |             | x         |
| teams.view                            |        | x      | x          | x           | x           | x         |
| teams.create/edit/delete              |        |        |            |             | x           | x         |
| settings.\*                           |        |        |            |             | x           | x         |
| system.\*                             |        |        |            |             |             | x         |

- **activities.create.any**: may choose any team that has create permission as lead team when creating (otherwise only the user's teams).
- **activities.delete.any**: may delete or restore-from-deleted any activity without being a comms contact or lead-team member. Without it, delete and restore-from-deleted are restricted as below.
- **Activity request delete**: **Request delete** (sets status to Delete requested) requires the `activities.requestDelete` permission **and** the user must be a comms contact on the activity or a member of the activity's lead team. The permission is granted to Editor, Advanced Editor, Admin, and System Admin.
- **Restore**: **Deleted** status: only users with `activities.delete.any` may restore. **Delete requested** status: users with `activities.requestDelete`, `activities.delete`, or `activities.delete.any` may restore **and** must be Admin/System Admin, a comms contact on the activity, or a member of the activity's lead team. Enforced by `CanRestoreActivityGuard`.
- **Delete (soft and hard)**: Requires `activities.delete` **and** (comms contact or lead-team member or `activities.delete.any`). Without `activities.delete.any`, the service allows delete only when the user is a comms contact or lead-team member for the activity. Enforced by `CanDeleteActivityGuard` and by the activities service for context.
- **Edit page when Delete requested or Deleted**: When an activity is in **Delete requested** or **Deleted** status, only **Admin** and **System Admin** may access the edit page. Other users (including those with `activities.edit`) can view the activity and use Restore from the banner if allowed; the UI redirects non-admins away from the edit page. No new permission is used; enforcement is role-based in the UI and via redirect. (Edit is implemented as a mode of the same activity page; the URL reflects edit state and non-admins are redirected to view when in delete_requested/deleted status.)
- **activities.review**: may set activity status to Reviewed when creating or updating (e.g. "Mark as reviewed" checkbox).
- **activities.lock.forceHandoff** (Admin / System Admin): may `POST /locks/activity/:activityId/force-handoff` to start a timed handoff of the edit lock, and may `DELETE /locks/activity/:activityId/force-handoff` to cancel a **pending** handoff. Only the user who requested the handoff (`to_user_id`) can cancel; other holders of the permission cannot cancel someone else's request.
- Bypass (see all activities): Advanced Viewer, Advanced Editor, Admin, System Admin.

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

| Method | Endpoint             | Description                                 | Auth Required |
| ------ | -------------------- | ------------------------------------------- | ------------- |
| POST   | /auth/login          | Login with username                         | No            |
| GET    | /auth/azure/config   | Returns whether Azure sign-in is configured | No            |
| GET    | /auth/azure          | Starts Azure AD OIDC redirect flow          | No            |
| GET    | /auth/azure/callback | Handles Azure AD callback                   | No            |
| GET    | /auth/me             | Get current user & permissions              | Yes           |
| POST   | /auth/logout         | Log out (client discards token)             | Yes           |
| POST   | /auth/refresh        | Refresh token (not implemented)             | Yes           |

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
    "roleId": 5,
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
import type { AuthUser } from '@corpcal/shared';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

### 403 Response Convention (Policy Guards)

When policy guards (e.g. `PermissionsGuard`, custom guards that throw `ForbiddenException`) deny access, the response body must follow this convention so that clients can handle 403s consistently:

- **`message`** (string): User-facing description. May include alternative conditions (e.g. "Required: activities.delete or be the comms lead for this activity").
- **`required`** (string[]): **Permission keys only** (e.g. values from `PERMISSIONS` in `@corpcal/shared`). Used by clients for programmatic handling (e.g. showing "You need permission X"). Do not put human-readable alternatives or free text in `required`; keep it machine-parseable and consistent with `PermissionsGuard`.
- **`hint`** (optional, string): Extra context, e.g. alternative ways to satisfy the check (e.g. "or be the comms lead for this activity").

Human-readable alternatives must not be placed in `required`. They belong in `message` or in the optional `hint` field.

### Data Scoping

Data scoping controls **which data** a user can see based on **teams** and **roles**. The backend sets `request.dataScope` on each request; services use it to filter results or enforce visibility.

#### Where teams and roles come from

- **Roles**: Each user has a `roleId`. At login, the auth service resolves it to a **role name** via `PolicyService.getRoleName(roleId)` and stores it in the JWT (along with permissions).
- **Teams**: At login, `PolicyService.getTeamIdsForUser(userId)` reads active rows from the `user_teams` table and stores the user's team IDs in the JWT as `teamIds`.

The JWT therefore carries `roleName`, `permissions`, and `teamIds`. These values do not change until the next login or token expiry (see [Token content and policy changes](#token-content-and-policy-changes)). For the schema behind team membership, see [SCHEMA_MAPPING.md](../packages/database/src/schema/docs/SCHEMA_MAPPING.md) (UserTeams section).

#### How dataScope is set

After the JWT is validated, **DataScopeInterceptor** (policy module) runs and sets `request.dataScope` using the authenticated user's **role** and **teamIds**:

```typescript
interface DataScope {
  teamIds: number[]; // User's team IDs (empty when bypass is true)
  bypass: boolean; // true for Advanced Viewer, Advanced Editor, Admin, System Admin
}
```

- **`bypass`**: Determined by `PolicyService.bypassesDataScoping(user.roleName)`. It is `true` only for **Advanced Viewer**, **Advanced Editor**, **Admin**, and **System Admin**.
- **`teamIds`**: When `bypass` is true, `teamIds` is set to `[]`. Otherwise it is the user's `teamIds` from the JWT (sourced from `user_teams` at login).

So **dataScope** is derived from role + teams: the role decides whether to bypass; the teams define the scope when not bypassing.

#### Which roles bypass

| Role            | Bypass | Effect                              |
| --------------- | ------ | ----------------------------------- |
| Viewer          | No     | Data restricted to the user's teams |
| Editor          | No     | Data restricted to the user's teams |
| Advanced Viewer | Yes    | Can see all data (no team filter)   |
| Advanced Editor | Yes    | Can see all data (no team filter)   |
| Admin           | Yes    | Can see all data (no team filter)   |
| System Admin    | Yes    | Can see all data (no team filter)   |

#### Activity visibility (list and view)

Activity list and single-activity view use **visibility** and **shared-with** to decide which activities a user sees when `dataScope.bypass` is false:

- **Global** (`visibility = 'global'`): The activity is visible to everyone (any team or no team). No team-based filter is applied for these activities.
- **Team** (`visibility = 'team'`): The activity is visible only to:
  - Members of the activity's **lead team** (`leadTeamId`),
  - Users with **data scope bypass** (Advanced Viewer, Advanced Editor, Admin, System Admin),
  - Users who are members of teams the activity is **shared with** (via `activity_shared_with_teams`).

So for team-visibility activities, "comms lead in user's team" and "lead ministry maps to user's team" do **not** grant visibility; only lead team and shared-with (plus bypass) apply. When the user has no teams (`teamIds.length === 0`), they see only global-visibility activities.

#### Activity edit restriction (shared-with view-only)

Users who can see an activity only because it is **shared with** one of their teams must not be able to edit it. The backend enforces this as follows:

- **CanEditActivityGuard**: Used on PATCH/PUT activity, PUT categories, PUT tags, PUT shared-with, and PUT themes. The user must have `activities.edit` (enforced by `@RequirePermission`) and at least one of: (a) comms contact for the activity, (b) member of the activity's lead team, or (c) Admin / System Admin. Otherwise the request is rejected with 403 (view-only for shared-with).
- **Response field `canEdit`**: The activity API response includes an optional `canEdit: boolean` when the request is authenticated. It is `true` when the user may edit (comms, lead team, or bypass) and `false` when the user has only shared-with access. The frontend uses this to hide the Edit button and keep the form read-only for shared-with-only users.
- **CanCloneActivityGuard**: Used on `POST /activities/:id/clone`. Clone does **not** introduce a new permission key; it reuses `activities.create` (enforced by `@RequirePermission`) and applies the same edit eligibility on the **source** activity as `CanEditActivityGuard` (admin/system-admin bypass, comms contact, or lead-team member). When the source is in **Delete requested** or **Deleted** status, the caller must additionally hold `activities.delete.any`, matching who is allowed to edit blocked activities. The new activity is always created in the **New** status, and fields governed by scopes the caller cannot edit (e.g. `notes`) are stripped from the copied payload. See [ACTIVITY_EDIT_ELIGIBILITY.md](../calendar-service/docs/ACTIVITY_EDIT_ELIGIBILITY.md#backend-cloning-an-activity-post-activitiesidclone) for details.

#### Activity response field-level read (redaction)

List and detail activity responses run `redactActivityResponse` in the activities controller. For scopes that have an `activities.<scope>.view` permission, the user must hold that permission, the matching `activities.<scope>.edit` permission (edit implies view), or a role that bypasses field view checks (Advanced Viewer, Advanced Editor, Admin, System Admin). Otherwise those response fields are omitted.

Some scopes **do not** define a view permission: **translations** and **pitch date** are always included for users who can access the activity; editing them still requires the corresponding `activities.<scope>.edit` grants where applicable.

#### Using dataScope in controllers and services

Controllers obtain `dataScope` via the `@RequestContext()` decorator and pass it into services:

```typescript
import { RequestContext } from '../policy/decorators/request-context.decorator';
import type { RequestContext as RequestContextType } from '../policy/dto/user-context.dto';

@Get()
async findAll(@RequestContext() ctx: RequestContextType) {
  const results = await this.activitiesService.findAll(filters, ctx.dataScope);
  return { success: true, data: results };
}
```

Services branch on `bypass` and `teamIds`:

- **`dataScope.bypass === true`**: Do not apply a team filter; return all rows the permission system allows.
- **`dataScope.bypass === false`**: Filter results by team/visibility rules. For **activities**, see [Activity visibility (list and view)](#activity-visibility-list-and-view): include global-visibility activities and, when `teamIds.length > 0`, team-visibility activities where the user is in the lead team or in a shared-with team; when `teamIds` is empty, only global-visibility activities are returned. Other resources may use a simple `teamId IN (dataScope.teamIds)` filter.

Example:

```typescript
@Injectable()
export class ActivitiesService {
  async findAll(dataScope: DataScope) {
    if (dataScope.bypass) {
      return this.db.select().from(activities);
    }
    if (dataScope.teamIds.length === 0) {
      return []; // or throw ForbiddenException depending on product rules
    }
    return this.db

---

## Local Email/Password Authentication

The `local` strategy allows users to log in with an email address and a bcrypt-hashed password stored in the `users` table. It can be used as the sole auth strategy or alongside Azure AD.

### Environment variables

| Variable | Values | Meaning |
|---|---|---|
| `AUTH_STRATEGY` | `local` | Use email/password as the **only** login method |
| `AUTH_STRATEGY` | `azure` + `LOCAL_AUTH_ENABLED=true` | Azure AD is primary; local login form also shown |
| `LOCAL_AUTH_ENABLED` | `true` | Enable local form alongside any primary strategy |

### Account lifecycle

```

created (admin) → status: pending
│
user visits /login,
enters email, gets
"set-password" prompt
│
▼
status: active ←── admin "Reset password" → status: password_reset_required
│
user enters reset code
and chooses new password
│
▼
status: active

```

- **`pending`** — account exists but no password has been set. User must complete the set-password flow before logging in.
- **`active`** — normal authenticated state.
- **`password_reset_required`** — admin initiated a reset. On the login page the user will be prompted for the reset code and a new password.

### New auth endpoints

These endpoints are added by this feature alongside the existing `/auth/*` routes:

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| `POST` | `/auth/check-email` | No | Returns the account status for an email address. Used by the login page to decide which step to show next. |
| `POST` | `/auth/set-password` | No | Sets a password for a `pending` account. |
| `POST` | `/auth/verify-reset-code` | No | Validates a reset code. |
| `POST` | `/auth/change-password` | No* | Changes the password after a successful `verify-reset-code` call. |
| `POST` | `/users/:id/initiate-password-reset` | `users.edit` | Generates a 48-hour reset code for the given user, sets their status to `password_reset_required`, and returns the plaintext code to the admin. |

\* The change-password endpoint is intentionally unauthenticated; the verified reset code acts as the credential.

### Password reset flow (admin-initiated)

1. An admin opens **User Management**, finds the user, and selects **Reset password** from the row actions menu.
2. The UI calls `POST /users/:id/initiate-password-reset` and displays the one-time reset code in a dialog. The admin must copy it and share it with the user out-of-band (e.g. by phone or secure message).
3. The user visits the login page, enters their email, and is presented with the **Enter reset code** step.
4. After entering a valid code the user is prompted to choose a new password.
5. On success the account returns to `active` and the used reset token is deleted.

### Scheduled cleanup

`SessionCleanupService` runs two scheduled jobs:

| Schedule | Job |
|----------|-----|
| Every hour, on the hour (`0 0 * * * *`) | Delete expired JWT sessions from the `sessions` table |
| Daily at 03:30 (`0 30 3 * * *`) | Delete expired rows from the `password_reset_tokens` table |

Tokens that are consumed by the user are deleted immediately on use; the daily job removes tokens for resets that were never completed.
      .select()
      .from(activities)
      .where(inArray(activities.teamId, dataScope.teamIds));
  }
}
```

#### End-to-end flow

1. **Login**: Auth loads user, then `getRoleName(roleId)`, `getPermissionsForRole(roleId)`, and `getTeamIdsForUser(userId)`; JWT is issued with `roleName`, `permissions`, and `teamIds`.
2. **Request**: JWT guard sets `request.user` (including `roleName` and `teamIds`).
3. **DataScopeInterceptor**: Sets `request.dataScope` from `user.roleName` (bypass) and `user.teamIds` (or `[]` when bypass).
4. **Handlers**: Use `@RequestContext()` to read `ctx.dataScope` and pass it to services.
5. **Services**: If `dataScope.bypass` then do not filter by team; otherwise filter by `dataScope.teamIds`.

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
    REVIEW: 'activities.review',
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
  VIEWER: 'Viewer',
  EDITOR: 'Editor',
  ADVANCED_VIEWER: 'Advanced Viewer',
  ADVANCED_EDITOR: 'Advanced Editor',
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

| Username        | Role            | Teams |
| --------------- | --------------- | ----- |
| john.doe        | Advanced Editor | -     |
| jane.smith      | Viewer          | -     |
| thomas.garcia   | Admin           | -     |
| daniel.robinson | System Admin    | -     |
| priya.patel     | Editor          | -     |

## Azure AD OIDC Integration (Production)

When `AUTH_STRATEGY=azure`:

1. User starts auth at `GET /auth/azure` (or `/api/auth/azure` from the UI).
2. Backend redirects to Azure AD using OpenID Connect authorization code flow.
3. Callback (`/auth/azure/callback`) validates state/nonce and exchanges code for tokens.
4. User is matched by `externalId` first, then by email if needed.
5. Local user profile is synced (`externalId`, username, display name, email, last login).
6. JWT is issued and stored in the httpOnly auth cookie.

If no active local account can be linked, login is denied with `azure_no_account`.

### Adding users

Admins with the `users.create` permission can add users via **Add user** on the User Management page. They provide the user's **email** (required), role, and optionally display name and initial team(s). A local account is created; email is required so the user can be matched when they first sign in with Microsoft. When that person signs in with Azure AD, they are matched by email and their identity is linked. No separate invite email is sent; the user must use the same email address when signing in.

## Active Directory Integration (Production)

When `AUTH_STRATEGY=ad`, the `ad.strategy.ts` file remains the extension point for direct AD credential validation flows.

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
