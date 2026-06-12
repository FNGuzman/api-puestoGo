import { IsNumber, IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditActionEnum } from 'src/common/enums/audit-action-enum';
import { Type } from 'class-transformer';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';

export class SearchAuditLogDto extends BaseSearchDto {
  @ApiProperty({
    description: 'ID de la auditoría',
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @ApiProperty({ description: 'ID del usuario', type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({ description: 'Tipo de acción', enum: AuditActionEnum })
  @IsOptional()
  @IsEnum(AuditActionEnum)
  action?: AuditActionEnum;

  @ApiProperty({
    description: 'Nombre de la entidad',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiProperty({
    description: 'ID de la entidad',
    type: Number,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  entityId?: number;

  @ApiProperty({ description: 'Método HTTP', type: String, required: false })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiProperty({
    description: 'Ruta de la petición',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiProperty({
    description: 'ID de la petición',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  requestId?: string;
}
