import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsEnum, IsString, MaxLength } from 'class-validator';
import { IsOptional } from 'class-validator';
import { GeneroEnum } from 'src/common/enums/genero-enum';

export class UpdateUsuarioAuthRequestDto {
  @ApiProperty({ description: 'Nombre de la Persona.', required: false })
  @IsOptional()
  @IsString({
    message: 'El nombre de la Persona deberia ser una cadena de texto',
  })
  nombre?: string;

  @ApiProperty({ description: 'Apellido de la Persona.', required: false })
  @IsOptional()
  @IsString({
    message: 'El apellido de la Persona deberia ser una cadena de texto',
  })
  apellido?: string;

  @ApiProperty({ description: 'Cuil de la Persona', required: false })
  @IsOptional()
  @IsString({
    message: 'El cuil de la Persona deberia ser una cadena de texto',
  })
  cuil?: string;

  @ApiProperty({ description: 'Genero de la Persona.', required: false })
  @IsOptional()
  @IsEnum(GeneroEnum, {
    message: 'El Genero de la Persona deberia ser una cadena de texto',
  })
  genero?: GeneroEnum;

  @ApiProperty({
    description: 'El correo electronico del usuario.',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Correo electronico invalido.' })
  email?: string;

  @ApiProperty({ description: 'Rol de la Persona.', required: false })
  @IsOptional()
  @IsNumber({}, {
    message: 'El rol de la Persona deberia ser un numero',
  })
  rol?: number;

  @ApiProperty({ description: 'Telefono de la persona', type: String, required: false, maxLength: 50 })
  @IsOptional()
  @IsString({
    message: 'El telefono de la persona deberia ser una cadena de texto',
  })
  @MaxLength(50, {
    message: 'El telefono no puede tener mas de 50 caracteres.',
  })
  telefono?: string;
}
