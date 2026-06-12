import { BaseEntity } from 'src/common/models/baseentity';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Plan } from './plan.entity';
import { SuscripcionCiclo } from '../enums/suscripcion-ciclo.enum';
import { SuscripcionEstado } from '../enums/suscripcion-estado.enum';

/**
 * Suscripción vigente del usuario (un registro por usuario; alinear con sesión móvil).
 */
@Entity('sub_01_cab_suscripcion_usuario')
export class UsuarioSuscripcion extends BaseEntity {
  @OneToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_user01' })
  usuario: Usuario;

  @ManyToOne(() => Plan, (p) => p.suscripciones, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'rela_sub02' })
  plan: Plan;

  @Column({
    name: 'sub01_estado',
    type: 'varchar',
    length: 20,
    default: SuscripcionEstado.ACTIVA,
  })
  estado: SuscripcionEstado;

  /** Fin del período pagado / trial (`subscriptionValidUntil` en la app). */
  @Column({ name: 'sub01_valido_hasta', type: 'datetime' })
  validoHasta: Date;

  /** Hasta cuándo puede usar la app en gracia offline. */
  @Column({ name: 'sub01_gracia_hasta', type: 'datetime' })
  graciaHasta: Date;

  @Column({ name: 'sub01_ultima_validacion', type: 'datetime', nullable: true })
  ultimaValidacionEn: Date | null;

  @Column({
    name: 'sub01_ciclo',
    type: 'varchar',
    length: 16,
    default: SuscripcionCiclo.MENSUAL,
  })
  ciclo: SuscripcionCiclo;

  @Column({ name: 'sub01_renovacion_auto', type: 'boolean', default: true })
  renovacionAutomatica: boolean;
}
