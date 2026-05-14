import { BaseEntity } from 'src/common/models/baseentity';
import { Column, Entity, OneToMany } from 'typeorm';
import { UsuarioSuscripcion } from './usuario-suscripcion.entity';
import { PlanFuncion } from './plan-funcion.entity';

/**
 * Catálogo de planes (precio mensual, límites y flags de funciones tipo app móvil).
 */
@Entity('sub_02_cat_plan')
export class Plan extends BaseEntity {
  @Column({ name: 'sub02_codigo', type: 'varchar', length: 32, unique: true })
  codigo: string;

  @Column({ name: 'sub02_nombre', type: 'varchar', length: 120 })
  nombre: string;

  @Column({ name: 'sub02_descripcion', type: 'varchar', length: 500, nullable: true })
  descripcion: string | null;

  /** Precio por ciclo de facturación (mensual si `cicloFacturacion` es mensual). */
  @Column({ name: 'sub02_precio', type: 'decimal', precision: 12, scale: 2, default: 0 })
  precio: string;

  @Column({ name: 'sub02_moneda', type: 'varchar', length: 8, default: 'ARS' })
  moneda: string;

  /** null = ilimitado (plan Pro). */
  @Column({ name: 'sub02_limite_productos', type: 'int', nullable: true })
  limiteProductos: number | null;

  @Column({ name: 'sub02_ajuste_masivo_precio', type: 'boolean', default: false })
  permiteAjusteMasivoPrecio: boolean;

  @Column({ name: 'sub02_ajuste_masivo_stock', type: 'boolean', default: false })
  permiteAjusteMasivoStock: boolean;

  /** Días de vigencia del período al asignar plan (ej. trial 30 días). */
  @Column({ name: 'sub02_periodo_evaluacion_dias', type: 'int', default: 30 })
  periodoEvaluacionDias: number;

  /** Días de gracia offline después de `validoHasta` (como `offlineGraceUntil` en la app). */
  @Column({ name: 'sub02_dias_gracia_offline', type: 'int', default: 5 })
  diasGraciaOffline: number;

  @Column({ name: 'sub02_activo', type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => UsuarioSuscripcion, (s) => s.plan)
  suscripciones: UsuarioSuscripcion[];

  @OneToMany(() => PlanFuncion, (f) => f.plan)
  funcionesPlan: PlanFuncion[];

  static fromId(id: number): Plan {
    const p = new Plan();
    p.id = id;
    return p;
  }
}
