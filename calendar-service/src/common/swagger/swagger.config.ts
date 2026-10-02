import { createRequire } from 'module';
import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import calendarServicePackage from '../../../package.json';

/**
 * Resolves the path to swagger-ui-dist static assets.
 * In this monorepo, swagger-ui-dist is hoisted to the root node_modules.
 * Finds the monorepo root by traversing up until we find the root package.json,
 * then resolves the path to node_modules/swagger-ui-dist.
 */
function getSwaggerUiDistPath(): string {
  // Find the monorepo root by looking for the root package.json
  let currentDir = __dirname;
  let rootDir: string | null = null;

  // Traverse up until we find the root package.json (at the monorepo root)
  while (currentDir !== dirname(currentDir)) {
    const packageJsonPath = join(currentDir, 'package.json');
    // Check if this is the root package.json (has workspaces field or is the monorepo root)
    if (existsSync(packageJsonPath)) {
      try {
        const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        // If it has workspaces, this is likely the monorepo root
        if (packageJson.workspaces) {
          rootDir = currentDir;
          break;
        }
      } catch {
        // If we can't read it, continue
      }
    }
    currentDir = dirname(currentDir);
  }

  // Fallback: if we didn't find the root, use a relative path from __dirname
  // This handles edge cases where the detection might fail
  if (!rootDir) {
    // Try the original approach as fallback
    rootDir = resolve(__dirname, '..', '..', '..', '..');
  }

  // Resolve path from root to node_modules/swagger-ui-dist
  const swaggerPath = resolve(rootDir, 'node_modules', 'swagger-ui-dist');

  if (!existsSync(join(swaggerPath, 'swagger-ui.css'))) {
    throw new Error(
      `Could not locate swagger-ui-dist package at ${swaggerPath}. Ensure it is installed.`
    );
  }

  return swaggerPath;
}

/**
 * OpenAPI info.version — calendar-service/package.json (inlined when webpack builds).
 */
if (
  calendarServicePackage.name !== 'calendar-service' ||
  typeof calendarServicePackage.version !== 'string'
) {
  throw new Error(
    'Swagger config must import version from calendar-service/package.json'
  );
}

const CALENDAR_SERVICE_VERSION = calendarServicePackage.version;

/** Brand CSS/JS emitted to dist/common/swagger by webpack (see webpack.config.js). */
function getSwaggerBrandAssetsDir(): string {
  return join(__dirname, 'common', 'swagger');
}

/** Shared package static assets (BC logo, BC Sans fonts) for Swagger UI. */
function getSharedSwaggerAssetsDir(): string {
  const require = createRequire(__filename);
  const bcsansCssPath = require.resolve(
    '@corpcal/shared/styles/bcsans-font-face.css'
  );
  return join(dirname(bcsansCssPath), '..', 'assets');
}

/**
 * API documentation description text.
 * This appears at the top of the Swagger UI interface.
 * OpenAPI `info.version` is {@link CALENDAR_SERVICE_VERSION} from calendar-service/package.json.
 * @author BC Government Corporate Calendar Team
 */
const API_DESCRIPTION = `
# Corporate Calendar API

REST API for BC Government Corporate Calendar activities, reference data, reports, and administration.

Endpoints are grouped by **tag** below (activities, lookups, teams, users, reports, locks, settings, and related areas).

## Authentication & authorization

- Most routes require a valid JWT. Send \`Authorization: Bearer <token>\` (API clients) or use the httpOnly session cookie set after login (browser clients).
- Login supports **Azure AD** (OIDC) and **local auth** when enabled; see the **auth** tag for entrypoints and availability checks.
- **Health** and **readiness** probes and most **auth** routes are public; everything else is protected by default.
- Access within authenticated sessions is enforced with permission-based RBAC (**401** unauthenticated, **403** forbidden). Some **403** responses for locked activities or reports include lock metadata in the problem body.

## JSON response shape

- Typical success responses: \`{ "success": true, "data": … }\` (or \`{ "success": true }\` when there is no payload).
- **Exceptions:** \`GET /health\` and \`GET /ready\` return probe payloads without the wrapper; **auth** Azure OIDC entrypoints return redirects; **reports** may return CSV, XLSX, or PDF file downloads.

## Query parameters

- List and filter endpoints often accept comma-separated ID lists (for example ministry or category filters). Invalid segments are handled strictly per schema—some params are dropped entirely when any segment is invalid; required ID params may return **400**.
- OpenAPI query descriptions are generated from the same Zod schemas used at runtime where possible.

## Validation, errors & limits

- Request and response contracts are validated with **Zod** (shared schemas in \`@corpcal/shared\` where applicable).
- Errors use **RFC 7807 Problem Details** (\`Content-Type: application/problem+json\`) with a **correlationId**; validation failures include an **errors** array with field paths and messages.
- Common statuses: **400** validation, **401** auth required, **403** forbidden or lock conflict, **404** not found, **409** conflict, **429** rate limit, **500** / **503** server errors.
- Requests are rate-limited globally; repeated abuse returns **429**. Clients may send **X-Correlation-ID**; it is echoed on responses for tracing.

## Using this documentation

- Operation-level schemas reflect Zod DTOs; for conventions (response wrappers, query patterns, auth exceptions), see \`docs/API_DTO_AND_SWAGGER.md\` in the repository.
- Swagger UI **Try it out** does not send browser cookies automatically; use a Bearer token when exercising protected routes here.
`;

/**
 * Sets up Swagger/OpenAPI documentation for the application.
 * Configures the API documentation with title, description, version, and tags.
 * Serves Swagger UI static assets and sets up the documentation endpoint.
 *
 * @param app - The NestJS application instance
 * @param configService - The configuration service for reading environment variables
 */
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService
): void {
  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  if (!swaggerEnabled && nodeEnv === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Corporate Calendar API')
    .setDescription(API_DESCRIPTION)
    .setVersion(CALENDAR_SERVICE_VERSION)
    .addTag(
      'activities',
      'Activity CRUD, list filters, history, flags, and sharing'
    )
    .addTag(
      'lookups',
      'Reference data (categories, tags, ministries, and related lookups)'
    )
    .addTag('health', 'Liveness and readiness probes for OpenShift')
    .addTag('teams', 'Teams, membership, and team change history')
    .addTag('users', 'Users, roles, permissions, and user change history')
    .addTag('drafts', 'Form draft save, restore, and lookup')
    .addTag('auth', 'Login, session, Azure AD and local auth availability')
    .addTag(
      'reports',
      'Report JSON data and CSV/XLSX/PDF exports (metadata via lookups/reports)'
    )
    .addTag('locks', 'Collaborative edit locks for activities and reports')
    .addTag(
      'settings',
      'Admin configuration under /settings (completion, look-ahead reset, reminders, review rules, report cover, info icons)'
    )
    .addTag('notifications', 'In-app notifications for the current user')
    .addTag('banner', 'Site banner and recurring lockout banner settings')
    .addTag('login-modal', 'Login modal content and settings')
    .addTag('activity-favourites', 'Per-user favourite activities')
    .addTag('activity-saved-filters', 'Per-user saved activity list filters')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Clean up OpenAPI document to properly handle Zod schemas
  cleanupOpenApiDoc(document);

  const expressApp = app as NestExpressApplication;

  // Swagger UI dist (default CSS/JS)
  const swaggerUiDistPath = getSwaggerUiDistPath();
  expressApp.useStaticAssets(swaggerUiDistPath, {
    prefix: '/api/',
    index: false,
  });

  const swaggerBrandAssetsDir = getSwaggerBrandAssetsDir();
  if (!existsSync(join(swaggerBrandAssetsDir, 'swagger-ui-brand.css'))) {
    throw new Error(
      `Missing Swagger brand assets at ${swaggerBrandAssetsDir}. Rebuild calendar-service.`
    );
  }
  expressApp.useStaticAssets(swaggerBrandAssetsDir, {
    prefix: '/api/',
    index: false,
  });

  expressApp.useStaticAssets(getSharedSwaggerAssetsDir(), {
    prefix: '/api/swagger-assets/',
    index: false,
  });

  // Setup Swagger UI with local assets
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
    },
    customSiteTitle: 'Corporate Calendar API Documentation',
    customfavIcon: '/api/swagger-assets/logo/bc-logo.svg',
    customCssUrl: ['/api/swagger-ui.css', '/api/swagger-ui-brand.css'],
    customJs: [
      '/api/swagger-ui-bundle.js',
      '/api/swagger-ui-standalone-preset.js',
      '/api/swagger-ui-brand.js',
    ],
  });
}
