import { IsNumber, IsEnum, IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditActionEnum } from 'src/common/enums/audit-action-enum';

export class CreateAuditLogDto {

  @ApiProperty({ description: 'ID del usuario que realiza la acción', type: Number, required: true })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ 
    description: 'Tipo de acción realizada',
    enum: AuditActionEnum,
    required: true
  })
  @IsNotEmpty()
  @IsEnum(AuditActionEnum)
  action: AuditActionEnum;

  @ApiProperty({ description: 'Nombre de la entidad afectada' })
  @IsNotEmpty()
  @IsString()
  entity: string;

  @ApiProperty({ description: 'ID de la entidad específica', type: Number, required: true })
  @IsNumber()
  entityId: number;

  @ApiPropertyOptional({ description: 'Estado anterior de la entidad' })
  @IsOptional()
  @IsObject()
  beforeJson?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Estado posterior de la entidad' })
  @IsOptional()
  @IsObject()
  afterJson?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Método HTTP utilizado' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'Ruta de la petición' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: 'ID único de la petición' })
  @IsOptional()
  @IsString()
  requestId?: string;
}
