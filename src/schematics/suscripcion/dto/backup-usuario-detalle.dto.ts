import { ApiProperty } from '@nestjs/swagger';

export class BackupUsuarioDetalleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombreOriginal: string;

  @ApiProperty()
  creadoEn: string;

  @ApiProperty({ description: 'Mismo formato que exporta la app (importable).' })
  payload: Record<string, unknown>;
}
