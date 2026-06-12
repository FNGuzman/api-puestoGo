import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceToken } from './entities/device-token.entity';
import { Notificacion } from './entities/notificacion.entity';
import { DeviceTokenRepository } from './repository/device-token.repository';
import { NotificacionRepository } from './repository/notificacion.repository';
import { FirebaseService } from './firebase.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken, Notificacion]), AuthModule],
  controllers: [NotificationsController],
  providers: [
    FirebaseService,
    DeviceTokenRepository,
    NotificacionRepository,
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
