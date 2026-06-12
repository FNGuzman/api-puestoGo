import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanFuncion } from './entities/plan-funcion.entity';
import { Plan } from './entities/plan.entity';
import { UsuarioBackup } from './entities/usuario-backup.entity';
import { UsuarioSuscripcion } from './entities/usuario-suscripcion.entity';
import { SuscripcionPago } from './entities/suscripcion-pago.entity';
import { SuscripcionService } from './suscripcion.service';
import { SuscripcionController } from './suscripcion.controller';
import { MercadoPagoCheckoutService } from './mercadopago-checkout.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      UsuarioSuscripcion,
      UsuarioBackup,
      SuscripcionPago,
      PlanFuncion,
    ]),
  ],
  controllers: [SuscripcionController],
  providers: [SuscripcionService, MercadoPagoCheckoutService],
  exports: [SuscripcionService],
})
export class SuscripcionModule {}
