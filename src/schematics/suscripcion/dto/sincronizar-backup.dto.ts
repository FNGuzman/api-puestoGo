import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

/** Cuerpo exportado por app-venta-flash (`exportDatabase`): `{ v, exportedAt, tables }`. */
export class SincronizarBackupDto {
  @ApiProperty({ description: 'Payload JSON del respaldo local (v1 o v2).' })
  @IsObject()
  payload!: Record<string, unknown>;
}
