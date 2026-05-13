import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRoot({
      ...DataSourceConfigLocal,
    }),
    CommonModule,
    EmailModule,
    AuthModule,
    UsuarioModule,
    PersonaModule,
    AuditModule,
    NotificationsModule,
    AuthApiModule,
  ],
  controllers: [],
  providers: [],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}