import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, MaxLength, MinLength, Matches, IsOptional } from 'class-validator';
import { GeneroEnum } from 'src/common/enums/genero-enum';
import { IsEqual } from 'src/common/decorators/is-equal.decorator';
import { pass_regex } from 'src/common/interfaces/regex/pass_regex';
import { ApplyUserDefaults } from 'src/common/decorators/apply-user-defaults.decorator';
import { AUTH_CONSTANTS } from 'src/common/constants/constants';
import { Type } from 'class-transformer';

export class CreateUsuarioAuthRequestDto {
  @ApiProperty({ description: 'Nombre de la Persona.' })
  @IsNotEmpty({ message: 'El nombre de la Persona es obligatorio.' })
  @IsString({ message: 'El nombre de la Persona deberia ser una cadena de texto' })
  nombre: string;

  @ApiProperty({ description: 'Apellido de la Persona.' })
  @IsNotEmpty({ message: 'El apellido de la Persona es obligatorio.' })
  @IsString({ message: 'El apellido de la Persona deberia ser una cadena de texto' })
  apellido: string;

  @ApiProperty({ description: 'Cuil de la Persona' })
  @IsNotEmpty({ message: 'El Cuil es obligatorio.' })
  @IsString({ message: 'El cuil de la Persona deberia ser una cadena de texto' })
  cuil: string;

  @ApiProperty({ description: 'Genero de la Persona.' })
  @IsNotEmpty({ message: 'El Genero del Persona es obligatoria.' })
  @IsEnum(GeneroEnum, {
    message: 'El Genero de la Persona deberia ser una cadena de texto',
  })
  genero: GeneroEnum;

  @ApiProperty({ description: 'Telefono de la Persona.' })
  @IsNotEmpty({ message: 'El Telefono de la Persona es obligatorio.' })
  @IsString({
    message: 'El Telefono de la Persona deberia ser una cadena de texto',
  })
  telefono: string;

  @ApiProperty({ description: 'El correo electronico del usuario.' })
  @IsNotEmpty({ message: 'El correo electronico es obligatorio.' })
  @IsString({ message: 'El correo electronico deberia ser una cadena de texto' })
  email: string;

  @ApiProperty({ description: 'La contrasena del usuario.' })
  @IsNotEmpty({ message: 'La contrasena es obligatoria.' })
  @IsString({ message: 'La contrasena debe ser una cadena de texto.' })
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres.' })
  @MaxLength(20, {
    message: 'La contrasena no puede tener mas de 20 caracteres.',
  })
  @Matches(pass_regex, { message: 'Contrasena debil.' })
  password: string;

  @ApiProperty({ description: 'La repeticion de la contrasena del usuario.' })
  @IsNotEmpty({ message: 'La repeticion de la contrasena es obligatoria.' })
  @IsString({
    message: 'La repeticion de la contrasena debe ser una cadena de texto.',
  })
  @MinLength(8, {
    message: 'La repeticion de la contrasena debe tener al menos 8 caracteres.',
  })
  @MaxLength(20, {
    message:
      'La repeticion de la contrasena no puede tener mas de 20 caracteres.',
  })
  @Matches(pass_regex, { message: 'Repeticion de contrasena debil.' })
  @IsEqual('password', { message: 'Las contrasenas no coinciden.' })
  repeatPassword: string;

  @ApiProperty({
    description: 'Sistema a relacionar (valor por defecto: SISTEMA_ID)',
    required: false,
    example: AUTH_CONSTANTS.SISTEMA_ID,
    default: AUTH_CONSTANTS.SISTEMA_ID,
  })
  @IsOptional()
  @IsNumber({})
  @ApplyUserDefaults()
  sistema?: number;

  @ApiProperty({
    description: 'Organizacion a relacionar (valor por defecto: ORGANIZACION_ID)',
    required: false,
    example: AUTH_CONSTANTS.ORGANIZACION_ID,
    default: AUTH_CONSTANTS.ORGANIZACION_ID,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({})
  @ApplyUserDefaults()
  organizacion?: number;

  @ApiProperty({
    description: 'Rol a relacionar',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber({})
  rol: number;
}
