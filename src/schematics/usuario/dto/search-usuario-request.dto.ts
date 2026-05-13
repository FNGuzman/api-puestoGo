import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { BaseSearchDto } from 'src/common/dto/base-search.dto';

export class SearchUsuarioRequestDto extends BaseSearchDto {
  @ApiProperty({ description: 'ID del usuario a buscar', type: Number, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @ApiProperty({ description: 'Email para filtrar', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Estado activo para filtrar', type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activo?: boolean;

  @ApiProperty({ description: 'Nombre de la persona para filtrar', required: false })
  @IsOptional()
  @IsString()
  nombrePersona?: string;
  
  @ApiProperty({ description: 'Apellido de la persona para filtrar', required: false })
  @IsOptional()
  @IsString()
  apellidoPersona?: string;
  
}
