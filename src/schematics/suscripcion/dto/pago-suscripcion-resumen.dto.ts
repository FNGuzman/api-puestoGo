import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PagoSuscripcionResumenDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  planCodigo: string;

  @ApiPropertyOptional()
  planNombre: string | null;

  @ApiProperty()
  ciclo: string;

  @ApiProperty()
  monto: string;

  @ApiProperty()
  moneda: string;

  @ApiProperty()
  estado: string;

  @ApiPropertyOptional()
  mpPaymentId: string | null;

  @ApiProperty()
  creadoEn: string;

  @ApiPropertyOptional()
  pagadoEn: string | null;
}
