import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { TipoNotificacionEnum } from 'src/common/enums/tipo-notificacion-enum';

/** Payload para crear una notificación (uso interno o admin). */
export class CreateNotificacionDto {

  @ApiProperty({ description: 'Tipo de notificación', enum: TipoNotificacionEnum })
  @IsEnum(TipoNotificacionEnum)
  tipo: TipoNotificacionEnum;

  @ApiPropertyOptional({ description: 'Título de la notificación', required: false })
  @IsOptional()
  @IsString()
  titulo: string | null;

  @ApiPropertyOptional({ description: 'Cuerpo de la notificación', required: false })
  @IsOptional()
  @IsString()
  cuerpo?: string | null;

  @ApiPropertyOptional({ description: 'Payload enviado en el push (data)', required: false })
  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown> | null;
}
