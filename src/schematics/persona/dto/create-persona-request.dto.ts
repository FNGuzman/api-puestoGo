import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePersonaRequestDto {

  @ApiProperty({ description: 'Nombre de la persona', type: String, nullable: false, example: 'Juan' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Apellido de la persona', type: String, nullable: false, example: 'Pérez' })
  @IsNotEmpty()
  @IsString()
  apellido: string;

}