import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
} from 'class-validator';

export class RegisterDeviceTokenRequestDto {
  @ApiProperty({
    description: 'Token FCM del dispositivo',
    example: 'dG9rZW4...',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  fcmToken: string;

  @ApiPropertyOptional({
    description: 'Plataforma',
    enum: ['android', 'ios', 'web'],
    default: 'android',
  })
  @IsOptional()
  @IsString()
  @IsIn(['android', 'ios', 'web'])
  platform?: 'android' | 'ios' | 'web';

  @ApiPropertyOptional({
    description: 'Identificador del dispositivo (opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Nombre del dispositivo (opcional, ej. "iPhone de Juan")',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;
}
