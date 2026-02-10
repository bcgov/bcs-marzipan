import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { CanDeleteActivityGuard } from './guards/can-delete-activity.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { DataScopeInterceptor } from './interceptors/data-scope.interceptor';
import { PolicyService } from './policy.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    PolicyService,
    PermissionsGuard,
    RolesGuard,
    CanDeleteActivityGuard,
    DataScopeInterceptor,
  ],
  exports: [
    PolicyService,
    PermissionsGuard,
    RolesGuard,
    CanDeleteActivityGuard,
    DataScopeInterceptor,
  ],
})
export class PolicyModule {}
