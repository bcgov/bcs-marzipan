import { existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

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
 * API documentation description text.
 * This appears at the top of the Swagger UI interface.
 * @version 0.0.1
 * @author BC Government Corporate Calendar Team
 */
const API_DESCRIPTION = `
# Corporate Calendar Service API Documentation

A comprehensive RESTful API for scheduling, managing, and tracking BC Government corporate activities, events, and reference data.

## Features

- **Activity Management**: Complete CRUD operations for calendar activities with event scheduling, status tracking, and metadata
- **Ministry Integration**: Activity associations with government ministries and representatives
- **Categorization & Tagging**: Flexible categorization system with tags, themes, and custom metadata
- **Venue Management**: Location tracking with venue addresses and scheduling considerations (in progress)
- **Sharing & Visibility**: Granular sharing controls with ministry-level and user-level permissions (in progress)
- **Reference Data**: Comprehensive lookup endpoints for categories, tags, ministries, languages, and statuses
- **Audit Trail**: Complete activity history tracking with soft delete and reason logging

## Authentication

Currently, the API operates in development mode with optional API key authentication. In production, endpoints will be secured with:
- Microsoft Azure Active Directory (Azure AD) authentication
- API key authentication via \`X-API-Key\` header
- Role-based access control (RBAC) for government staff
- Session-based authentication for web clients

## Data Validation

All endpoints use Zod schema validation ensuring:
- Type-safe request/response handling
- Consistent error messaging
- Input sanitization and validation

## Error Handling

The API follows consistent error response patterns:
- **400 Bad Request**: Validation errors, malformed data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: System errors

All errors return JSON responses with detailed error messages and validation details.
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
    .setTitle('Calendar Service API')
    .setDescription(API_DESCRIPTION)
    .setVersion('1.0.0')
    .addTag('activities', 'Calendar activity management endpoints')
    .addTag('lookups', 'Reference data lookup endpoints')
    .addTag('health', 'Health check and readiness probe endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Clean up OpenAPI document to properly handle Zod schemas
  cleanupOpenApiDoc(document);

  // Serve Swagger UI static assets from local node_modules
  const swaggerUiDistPath = getSwaggerUiDistPath();
  (app as NestExpressApplication).useStaticAssets(swaggerUiDistPath, {
    prefix: '/api/',
    index: false, // Don't serve index.html from swagger-ui-dist
  });

  // Setup Swagger UI with local assets
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Calendar Service API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    // Use local paths - SwaggerModule will generate HTML that references these
    customCssUrl: '/api/swagger-ui.css',
    customJs: [
      '/api/swagger-ui-bundle.js',
      '/api/swagger-ui-standalone-preset.js',
    ],
  });
}
