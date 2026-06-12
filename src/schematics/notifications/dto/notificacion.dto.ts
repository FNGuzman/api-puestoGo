import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TipoNotificacionEnum } from 'src/common/enums/tipo-notificacion-enum';
import { CommonDTO } from 'src/common/dto/common.dto';

export class NotificacionDTO extends CommonDTO {
  @ApiProperty({
    description: 'Tipo de notificación',
    enum: TipoNotificacionEnum,
  })
  @Expose()
  tipo: TipoNotificacionEnum;

  @ApiPropertyOptional({
    description: 'Título de la notificación',
    required: false,
  })
  @Expose()
  titulo: string | null;

  @ApiPropertyOptional({
    description: 'Cuerpo de la notificación',
    required: false,
  })
  @Expose()
  cuerpo: string | null;

  @ApiPropertyOptional({
    description: 'Payload enviado en el push (data)',
    required: false,
  })
  @Expose()
  payloadJson: Record<string, string> | null;

  @ApiProperty({
    description: 'Estado de lectura de la notificación',
    type: Boolean,
  })
  @Expose()
  leido: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de lectura de la notificación',
    required: false,
  })
  @Expose()
  leidoEn: Date | null;
}
