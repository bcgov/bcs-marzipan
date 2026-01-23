import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Apply rate limiting globally
  const configService = app.get(ConfigService);
  app.useGlobalInterceptors(new RateLimitInterceptor(configService));

  const allowedOrigins = [
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

  // Initialize Swagger/OpenAPI documentation
  setupSwagger(app, configService);

  await app.listen(process.env.PORT ?? 3001);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
