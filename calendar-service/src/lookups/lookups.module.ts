import { Module } from '@nestjs/common';
import { LookupsService } from './lookups.service';
import { LookupsController } from './lookups.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [LookupsService],
  controllers: [LookupsController],
})
export class LookupsModule {}
