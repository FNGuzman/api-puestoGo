import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { CreatePersonaRequestDto } from 'src/schematics/persona/dto/create-persona-request.dto';
import { IsEqual } from 'src/common/decorators/is-equal.decorator';

export class SignupRequestDto extends CreatePersonaRequestDto {
  @ApiProperty({ description: 'Contraseña del usuario', type: String, nullable: false, example: 'mipassword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({ description: 'Repetir contraseña (debe coincidir con contrasena)', type: String, nullable: false, example: 'mipassword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @IsEqual('contrasena', { message: 'La contraseña y su repetición deben ser iguales' })
  confirmarContrasena: string;

  @ApiProperty({ description: 'Email del usuario', type: String, nullable: false, example: 'juanperez@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  /**
   * Whitelist para `forbidNonWhitelisted`: el front suele mandar "" en JSON.
   * En multipart el archivo va por el campo homónimo (Multer), no por este string.
   */
  @ApiPropertyOptional({
    description: 'Opcional. En JSON puede omitirse o ir vacío; en multipart es el archivo de imagen.',
  })
  @IsOptional()
  @Allow()
  fotoPerfil?: string;

}