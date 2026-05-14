import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordRequestDto {
  @ApiProperty({ description: 'Email de la cuenta', example: 'usuario@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
