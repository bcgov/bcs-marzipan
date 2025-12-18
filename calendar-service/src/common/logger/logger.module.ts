import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logger.service';

/**
 * Global logger module that provides AppLogger service.
 * Since it's marked as Global, it can be used in any module without importing.
 */
@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
