import './types/express';

import * as path from 'path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { ActivitiesModule } from './activities/activities.module';
import { ActivityCompletionModule } from './activity-completion/activity-completion.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { BannerModule } from './banner/banner.module';
import { LoggerModule } from './common/logger/logger.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { DatabaseModule } from './database/database.module';
import { DraftsModule } from './drafts/drafts.module';
import { LocksModule } from './locks/locks.module';
import { LoginModalModule } from './login-modal/login-modal.module';
import { LookAheadResetModule } from './look-ahead-reset/look-ahead-reset.module';
import { LookAheadModule } from './look-ahead/look-ahead.module';
import { LookupsModule } from './lookups/lookups.module';
import { PermissionsGuard } from './policy/guards/permissions.guard';
import { RolesGuard } from './policy/guards/roles.guard';
import { DataScopeInterceptor } from './policy/interceptors/data-scope.interceptor';
import { PolicyModule } from './policy/policy.module';
import { ReportsModule } from './reports/reports.module';
import { SavedFiltersModule } from './saved-filters/saved-filters.module';
import { TeamsModule } from './teams/teams.module';
import { UsersModule } from './users/users.module';

/**
 * Resolves the root .env file path.
 * The .env file is located at the monorepo root.
 * From source: calendar-service/src -> root is ../../.env
 * From compiled: calendar-service/dist/src -> root is ../../../.env
 */
function resolveRootEnvPath(): string {
  // Check if we're running from compiled code (in dist directory)
  const isCompiled = __dirname.includes(path.sep + 'dist' + path.sep);
  return path.resolve(__dirname, isCompiled ? '../../../.env' : '../../.env');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Load .env from root directory
      envFilePath: resolveRootEnvPath(),
    }),
    ScheduleModule.forRoot(),
    LoggerModule,
    DatabaseModule,
    PolicyModule,
    AuthModule,
    BannerModule,
    LoginModalModule,
    ActivitiesModule,
    ActivityCompletionModule,
    LookAheadResetModule,
    LocksModule,
    LookupsModule,
    DraftsModule,
    ReportsModule,
    SavedFiltersModule,
    LookAheadModule,
    UsersModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    CorrelationIdMiddleware,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: DataScopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
