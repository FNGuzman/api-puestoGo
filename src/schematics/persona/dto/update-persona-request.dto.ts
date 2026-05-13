import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePersonaRequestDto {
  @ApiProperty({ description: 'Nombre de la persona', type: String, required: false, example: 'Juan' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'Apellido de la persona', type: String, required: false, example: 'Pérez' })
  @IsOptional()
  @IsString()
  apellido?: string;
}
