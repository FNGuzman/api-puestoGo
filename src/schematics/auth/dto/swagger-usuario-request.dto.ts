import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { SignupRequestDto } from './signup-request.dto';

export class SwaggerSignupRequestDto extends SignupRequestDto {

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Foto de perfil del usuario (JPG, JPEG, PNG, GIF, WEBP)',
    required: false,
  })
  @IsOptional()
  fotoPerfil?: any 

}