import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsString } from 'class-validator';
import { SuscripcionCiclo } from '../enums/suscripcion-ciclo.enum';
import { PLAN_CODIGO } from '../constants/plan-codigos';

/** Solo Pro admite checkout; Equipo queda “próximamente” en la landing. */
const PLANES_PAGO = [PLAN_CODIGO.PRO] as const;

export class CheckoutSuscripcionDto {
  @ApiProperty({ enum: PLANES_PAGO, example: PLAN_CODIGO.PRO })
  @IsString()
  @IsIn([...PLANES_PAGO])
  planCodigo: (typeof PLANES_PAGO)[number];

  @ApiProperty({ enum: SuscripcionCiclo, example: SuscripcionCiclo.MENSUAL })
  @IsEnum(SuscripcionCiclo)
  ciclo: SuscripcionCiclo;
}
