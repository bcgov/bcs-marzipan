import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { AppLogger } from './common/logger/logger.service';
import { setupSwagger } from './common/swagger/swagger.config';
import { setupGracefulShutdown } from './common/utils/graceful-shutdown';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust the reverse proxy so forwarded host/proto headers are honored.
  app.set('trust proxy', 1);

  // Enable cookie parsing for httpOnly auth cookies
  app.use(cookieParser());

  // Apply global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply rate limiting globally
  const configService = app.get(ConfigService);
  app.useGlobalInterceptors(new RateLimitInterceptor(configService));

  // Get CORS allowed origins from environment variable or use defaults
  const corsOriginsEnv = configService.get<string>('CORS_ALLOWED_ORIGINS');
  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:3000',
        'http://localhost:4173',
        'http://localhost:8080',
      ];

  // Enable CORS with credentials for httpOnly cookie authentication
  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Required for httpOnly cookie auth
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Correlation-ID',
    ],
    exposedHeaders: ['X-Correlation-ID'],
  });

  // Initialize Swagger/OpenAPI documentation
  setupSwagger(app, configService);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  // Get logger for shutdown handling
  const logger = app.get(AppLogger);

  // Log startup
  logger.log(`Application is running on: http://localhost:${port}`);

  // Setup graceful shutdown handling
  setupGracefulShutdown(app, logger);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
