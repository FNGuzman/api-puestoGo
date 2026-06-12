import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutSuscripcionResponseDto {
  @ApiProperty({ description: 'URL para abrir el checkout de Mercado Pago' })
  init_point: string;

  @ApiPropertyOptional()
  preference_id?: string;

  @ApiPropertyOptional({
    description:
      'Si true, el plan ya se aplicó sin pasar por MP (solo desarrollo)',
  })
  mock?: boolean;

  @ApiPropertyOptional()
  mensaje?: string;
}
