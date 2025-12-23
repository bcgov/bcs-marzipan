import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply rate limiting globally
  const configService = app.get(ConfigService);
  app.useGlobalInterceptors(new RateLimitInterceptor(configService));

  const allowedOrigins = [
    'https://calendar-ui-b3237c-dev.apps.gold.devops.gov.bc.ca',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:8080',
  ];

  // Enable CORS for development
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
