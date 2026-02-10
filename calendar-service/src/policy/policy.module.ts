import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PolicyService } from './policy.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { CanDeleteActivityGuard } from './guards/can-delete-activity.guard';
import { DataScopeInterceptor } from './interceptors/data-scope.interceptor';

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
