import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupSwagger } from './common/swagger/swagger.config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable cookie parsing for httpOnly auth cookies
  app.use(cookieParser());

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  // Initialize Swagger/OpenAPI documentation
  setupSwagger(app, configService);

  await app.listen(process.env.PORT ?? 3001);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
