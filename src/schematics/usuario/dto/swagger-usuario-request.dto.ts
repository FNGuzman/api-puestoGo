import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUsuarioRequestDto } from './create-usuario-request.dto';
import { UpdateUsuarioRequestDto } from './update-usuario-request.dto';

export class SwaggerCreateUsuarioRequestDto extends CreateUsuarioRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Foto de perfil del usuario (JPG, JPEG, PNG, GIF, WEBP)',
    required: false,
  })
  @IsOptional()
  fotoPerfil?: any;
}

export class SwaggerUpdateUsuarioRequestDto extends UpdateUsuarioRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Nueva foto de perfil del usuario (JPG, JPEG, PNG, GIF, WEBP). Si se envía, reemplazará la imagen actual.',
    required: false,
  })
  @IsOptional()
  fotoPerfil?: any;

  @ApiProperty({
    type: 'string',
    description:
      'URL de la foto de perfil actual. Si se envía junto con fotoPerfil, se ignorará. Si solo se envía esta URL, se mantendrá la imagen actual. Si se envía vacía, se eliminará la imagen.',
    required: false,
    example: 'https://example.com/fotos-perfiles/imagen_1234567890.png',
  })
  @IsOptional()
  @IsString()
  urlFotoPerfil?: string;
}
