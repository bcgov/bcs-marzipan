import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PolicyService } from './policy.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { DataScopeInterceptor } from './interceptors/data-scope.interceptor';

@Module({
  imports: [DatabaseModule],
  providers: [
    PolicyService,
    PermissionsGuard,
    RolesGuard,
    DataScopeInterceptor,
  ],
  exports: [PolicyService, PermissionsGuard, RolesGuard, DataScopeInterceptor],
})
export class PolicyModule {}
