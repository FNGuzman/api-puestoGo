import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BackupUsuarioResumenDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombreOriginal: string;

  @ApiProperty()
  tamanoBytes: string;

  @ApiProperty()
  origen: string;

  @ApiProperty()
  creadoEn: string;

  @ApiPropertyOptional()
  checksumSha256: string | null;

  @ApiProperty({ description: 'true si el JSON está guardado en DB (descargable desde la app o el panel).' })
  tienePayloadEnDb: boolean;
}
