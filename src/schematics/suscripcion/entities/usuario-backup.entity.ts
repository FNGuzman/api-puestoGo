import { BaseEntity } from 'src/common/models/baseentity';
import { AuditExclude } from 'src/schematics/audit/config/audit.constants';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Copia de seguridad del usuario: metadatos + JSON opcional en base (sin depender de disco en K8s).
 * `claveAlmacenamiento` puede usarse para R2 u otro storage externo; si `payloadJson` está lleno, el backup vive en DB.
 */
@Entity('sub_04_cab_backup_usuario')
export class UsuarioBackup extends BaseEntity {
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_user01' })
  usuario: Usuario;

  @Column({ name: 'sub04_nombre_original', type: 'varchar', length: 500 })
  nombreOriginal: string;

  @AuditExclude()
  @Column({
    name: 'sub04_clave_almacenamiento',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  claveAlmacenamiento: string | null;

  @Column({ name: 'sub04_tamano_bytes', type: 'bigint', default: 0 })
  tamanoBytes: string;

  @AuditExclude()
  @Column({
    name: 'sub04_checksum_sha256',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  checksumSha256: string | null;

  @Column({
    name: 'sub04_origen',
    type: 'varchar',
    length: 32,
    default: 'upload',
  })
  origen: string;

  /** Copia completa del backup (JSON) en base de datos; apto para Kubernetes sin volumen compartido. */
  @AuditExclude()
  @Column({ name: 'sub04_payload_json', type: 'json', nullable: true })
  payloadJson: Record<string, unknown> | null;

  static fromId(id: number): UsuarioBackup {
    const b = new UsuarioBackup();
    b.id = id;
    return b;
  }
}
