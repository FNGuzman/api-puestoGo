import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginUsuarioRequestDto {
  @ApiProperty({
    description: 'Email del usuario para iniciar sesión',
    type: String,
    required: true,
    example: 'juanperez@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    type: String,
    required: true,
    example: 'mipassword123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;
}
