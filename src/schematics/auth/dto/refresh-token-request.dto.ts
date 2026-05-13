import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RefreshTokenRequestDto {
  @ApiProperty({
    description: 'Refresh token recibido en login o en la última renovación',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000, { message: 'refresh_token no válido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  refresh_token: string;
}
