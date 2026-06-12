import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { DataSourceConfigLocal } from './config/typeorm/data-source-local';
import { LoggingMiddleware } from './middlewares/log-middleware';
import { CommonModule } from './common/common.module';
import { EmailModule } from './common/email/email.module';
import { AuthModule } from './schematics/auth/auth.module';
import { UsuarioModule } from './schematics/usuario/usuario.module';
import { PersonaModule } from './schematics/persona/persona.module';
import { AuditModule } from './schematics/audit/audit.module';
import { NotificationsModule } from './schematics/notifications/notifications.module';
import { AuthApiModule } from './integrations/auth-api/auth-api.module';
import { SuscripcionModule } from './schematics/suscripcion/suscripcion.module';
import { HealthModule } from './health/health.module';

const throttleLimit =
  process.env.NODE_ENV === 'production'
    ? Number(process.env.THROTTLE_LIMIT || 20)
    : Number(process.env.THROTTLE_LIMIT || 100);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL_MS || 60_000),
        limit: throttleLimit,
      },
    ]),
    TypeOrmModule.forRoot({
      ...DataSourceConfigLocal,
    }),
    HealthModule,
    CommonModule,
    EmailModule,
    SuscripcionModule,
    AuthModule,
    UsuarioModule,
    PersonaModule,
    AuditModule,
    NotificationsModule,
    AuthApiModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
