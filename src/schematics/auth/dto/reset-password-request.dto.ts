import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { IsEqual } from 'src/common/decorators/is-equal.decorator';

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'Email de la cuenta',
    example: 'usuario@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Código de 6 dígitos enviado por correo',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'El código debe ser numérico de 6 dígitos' })
  codigo: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    minLength: 6,
    example: 'nuevaClave123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({
    description: 'Repetir la nueva contraseña',
    minLength: 6,
    example: 'nuevaClave123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @IsEqual('contrasena', {
    message: 'La contraseña y su repetición deben ser iguales',
  })
  confirmarContrasena: string;
}
