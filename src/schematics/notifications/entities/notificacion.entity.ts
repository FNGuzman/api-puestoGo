import { TipoNotificacionEnum } from 'src/common/enums/tipo-notificacion-enum';
import { BaseEntity } from 'src/common/models/baseentity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';

@Entity({ name: 'noti_02_mov_notificacion' })
export class Notificacion extends BaseEntity {

  @ManyToOne(() => Usuario, (usuario) => usuario.notificaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_usua02' })
  usuario: Usuario;

  @Column({ name: 'noti02_tipo', type: 'enum', enum: TipoNotificacionEnum })
  tipo: TipoNotificacionEnum;

  @Column({ name: 'noti02_titulo', type: 'varchar', length: 255, nullable: true })
  titulo: string | null;

  @Column({ name: 'noti02_cuerpo', type: 'text', nullable: true })
  cuerpo: string | null;

  @Column({ name: 'noti02_payload_json', type: 'json', nullable: true })
  payloadJson: Record<string, unknown> | null;

  @Column({ name: 'noti02_leido', type: 'boolean', default: false })
  leido: boolean;

  @Column({ name: 'noti02_leido_en', type: 'datetime', nullable: true })
  leidoEn: Date | null;

  static fromId(id: number): Notificacion {
    const e = new Notificacion();
    e.id = id;
    return e;
  }
}
