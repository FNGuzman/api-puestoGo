import { ApiProperty } from '@nestjs/swagger';

export class PlanCatalogoDto {
  @ApiProperty()
  codigo: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ required: false })
  descripcion: string | null;

  @ApiProperty()
  precio: string;

  @ApiProperty()
  moneda: string;

  @ApiProperty({ required: false, nullable: true })
  limiteProductos: number | null;

  @ApiProperty({
    type: [String],
    description: 'Códigos de funciones incluidas en el plan',
  })
  funcionesHabilitadas: string[];

  @ApiProperty()
  permiteAjusteMasivoPrecio: boolean;

  @ApiProperty()
  permiteAjusteMasivoStock: boolean;

  @ApiProperty({ description: 'Precio de un pago anual (10× tarifa mensual: 2 meses de regalo)' })
  precioAnual: string;
}
