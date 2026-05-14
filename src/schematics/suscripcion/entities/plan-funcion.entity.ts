import { BaseEntity } from 'src/common/models/baseentity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Plan } from './plan.entity';

/**
 * Relación plan ↔ función (ej. ajuste masivo solo en Pro/Equipo).
 * Tabla: sub_05_rel_plan_funcion
 */
@Entity('sub_05_rel_plan_funcion')
@Unique('uk_sub05_plan_funcion', ['plan', 'funcionCodigo'])
export class PlanFuncion extends BaseEntity {
  @ManyToOne(() => Plan, (p) => p.funcionesPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_sub02' })
  plan: Plan;

  @Column({ name: 'sub05_funcion_codigo', type: 'varchar', length: 64 })
  funcionCodigo: string;
}
