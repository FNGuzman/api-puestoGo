import { BaseEntity } from 'src/common/models/baseentity';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SuscripcionCiclo } from '../enums/suscripcion-ciclo.enum';
import { PagoSuscripcionEstado } from '../enums/pago-suscripcion-estado.enum';

@Entity('sub_03_mov_pago_suscripcion')
export class SuscripcionPago extends BaseEntity {
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_user01' })
  usuario: Usuario;

  @Column({ name: 'sub03_plan_codigo', type: 'varchar', length: 32 })
  planCodigo: string;

  @Column({
    name: 'sub03_plan_nombre',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  planNombre: string | null;

  @Column({ name: 'sub03_ciclo', type: 'varchar', length: 16 })
  ciclo: SuscripcionCiclo;

  @Column({ name: 'sub03_monto', type: 'decimal', precision: 12, scale: 2 })
  monto: string;

  @Column({ name: 'sub03_moneda', type: 'varchar', length: 8 })
  moneda: string;

  @Column({
    name: 'sub03_estado',
    type: 'varchar',
    length: 20,
    default: PagoSuscripcionEstado.PENDIENTE,
  })
  estado: PagoSuscripcionEstado;

  @Column({
    name: 'sub03_mp_preference_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  mpPreferenceId: string | null;

  @Column({
    name: 'sub03_mp_payment_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  mpPaymentId: string | null;

  @Column({
    name: 'sub03_external_ref',
    type: 'varchar',
    length: 80,
    unique: true,
  })
  externalRef: string;

  @Column({ name: 'sub03_paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;
}
