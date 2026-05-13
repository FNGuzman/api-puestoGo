import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEmail } from 'class-validator';

export class ChangePasswordRequestDto {

  @ApiProperty({ description: 'Email del usuario', type: String, nullable: false, example: 'usuario@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Nueva contraseña del usuario', type: String, nullable: false, example: 'nuevaPassword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  contrasena: string;

  @ApiProperty({ description: 'Confirmación de la nueva contraseña', type: String, nullable: false, example: 'nuevaPassword123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  confirmarContrasena: string;

}

