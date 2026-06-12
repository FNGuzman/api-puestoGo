import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CommonDTO } from 'src/common/dto/common.dto';
import { AuditActionEnum } from 'src/common/enums/audit-action-enum';
import { UserDataDto } from './user-data.dto';

export class AuditoriaDTO extends CommonDTO {
  @ApiProperty({
    description: 'ID del usuario que realiza la acción',
    type: Number,
    nullable: false,
  })
  @Type(() => Number)
  @Expose()
  userId: number;

  @ApiProperty({
    description: 'Tipo de acción realizada',
    enum: AuditActionEnum,
    nullable: false,
  })
  @Expose()
  action: AuditActionEnum;

  @ApiProperty({
    description: 'Nombre de la entidad afectada',
    type: String,
    nullable: false,
  })
  @Expose()
  entity: string;

  @ApiProperty({
    description: 'ID de la entidad específica',
    type: Number,
    nullable: false,
  })
  @Expose()
  entityId: number;

  @ApiProperty({
    description: 'Estado anterior de la entidad',
    type: Object,
    nullable: true,
  })
  @Expose()
  beforeJson: Record<string, any>;

  @ApiProperty({
    description: 'Estado posterior de la entidad',
    type: Object,
    nullable: true,
  })
  @Expose()
  afterJson: Record<string, any>;

  @ApiProperty({
    description: 'Método HTTP utilizado',
    type: String,
    nullable: true,
  })
  @Expose()
  method: string;

  @ApiProperty({
    description: 'Ruta de la petición',
    type: String,
    nullable: true,
  })
  @Expose()
  path: string;

  @ApiProperty({
    description: 'ID único de la petición',
    type: String,
    nullable: true,
  })
  @Expose()
  requestId: string;

  @ApiProperty({
    description: 'Datos del usuario que realizó la acción',
    type: UserDataDto,
    nullable: true,
  })
  @Expose()
  @Type(() => UserDataDto)
  userData?: UserDataDto;
}
