import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SuscripcionCiclo } from 'src/schematics/suscripcion/enums/suscripcion-ciclo.enum';
import { SuscripcionEstado } from 'src/schematics/suscripcion/enums/suscripcion-estado.enum';

/** Resumen para cliente (app / landing), alineado con `SessionPayload` móvil. */
export class SuscripcionResumenDto {
  @ApiProperty({ example: 'BASICO' })
  @Expose()
  planCodigo: string;

  @ApiProperty({ example: 'Básico' })
  @Expose()
  planNombre: string;

  @ApiProperty({ enum: SuscripcionEstado, example: SuscripcionEstado.ACTIVA })
  @Expose()
  estado: SuscripcionEstado;

  @ApiProperty({ description: 'Fin del período pagado / trial (ISO en JSON)' })
  @Expose()
  validoHasta: Date;

  @ApiProperty({ description: 'Fin de gracia offline' })
  @Expose()
  graciaHasta: Date;

  @ApiPropertyOptional({ description: 'Última validación con servidor' })
  @Expose()
  ultimaValidacionEn?: Date | null;

  @ApiProperty({ enum: SuscripcionCiclo })
  @Expose()
  ciclo: SuscripcionCiclo;

  @ApiProperty({ example: true })
  @Expose()
  renovacionAutomatica: boolean;

  @ApiPropertyOptional({ description: 'Límite de productos del plan; null = ilimitado' })
  @Expose()
  limiteProductos: number | null;

  @ApiProperty({
    type: [String],
    description: 'Códigos de funciones incluidas en el plan (ej. AJUSTE_MASIVO_PRECIO)',
    example: ['AJUSTE_MASIVO_PRECIO', 'AJUSTE_MASIVO_STOCK', 'GENERAR_ETIQUETAS', 'BACKUP_NUBE'],
  })
  @Expose()
  funcionesHabilitadas: string[];

  @ApiProperty()
  @Expose()
  permiteAjusteMasivoPrecio: boolean;

  @ApiProperty()
  @Expose()
  permiteAjusteMasivoStock: boolean;

  @ApiProperty({ example: '9.00' })
  @Expose()
  precioPlan: string;

  @ApiProperty({ example: 'USD' })
  @Expose()
  monedaPlan: string;
}
