import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DEFAULT_JWT_EXPIRES_IN } from '@corpcal/shared';
import { DatabaseModule } from '../database/database.module';
import { PolicyModule } from '../policy/policy.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    DatabaseModule,
    PolicyModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const devDefault = 'dev-secret-change-in-production';
        const secret = config.get<string>('JWT_SECRET', devDefault);
        const nodeEnv = config.get<string>('NODE_ENV', 'development');

        if (nodeEnv === 'production') {
          if (!secret || secret === devDefault) {
            throw new Error(
              'JWT_SECRET must be set to a strong, random value in production. ' +
                'DO NOT use the default dev secret. Set the JWT_SECRET environment variable.'
            );
          }
        }

        return {
          secret,
          signOptions: {
            expiresIn: Number(
              config.get<string | number>(
                'JWT_EXPIRES_IN',
                DEFAULT_JWT_EXPIRES_IN
              ) ?? DEFAULT_JWT_EXPIRES_IN
            ),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
