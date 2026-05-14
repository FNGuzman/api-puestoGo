import { BaseEntity } from 'src/common/models/baseentity';
import { AuditExclude } from 'src/schematics/audit/config/audit.constants';
import { DeviceToken } from 'src/schematics/notifications/entities/device-token.entity';
import { Notificacion } from 'src/schematics/notifications/entities/notificacion.entity';
import { Persona } from 'src/schematics/persona/entities/persona.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

@Entity('user_01_cab_usuario')
export class Usuario extends BaseEntity {

  @Column({ name: 'user01_email', type: 'varchar', length: 255, nullable: false })
  email: string;

  @AuditExclude()
  @Column({ name: 'user01_contrasena', type: 'varchar', length: 255 })
  contrasena: string;

  @Column({ name: 'user01_email_verificado', type: 'boolean', default: false })
  emailVerificado: boolean;

  @AuditExclude()
  @Column({ name: 'user01_codigo_verificacion', type: 'varchar', length: 10, nullable: true })
  codigoVerificacionEmail: string | null;

  @AuditExclude()
  @Column({ name: 'user01_codigo_verificacion_expira', type: 'varchar', length: 20, nullable: true })
  codigoVerificacionExpiraEn: string | null;

  @AuditExclude()
  @Column({ name: 'user01_codigo_recuperacion', type: 'varchar', length: 10, nullable: true })
  codigoRecuperacionContrasena: string | null;

  @AuditExclude()
  @Column({ name: 'user01_codigo_recuperacion_expira', type: 'varchar', length: 20, nullable: true })
  codigoRecuperacionExpiraEn: string | null;

  @Column({ name: 'user01_activo', type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'user01_ultimo_acceso', type: 'datetime', nullable: true })
  ultimoAcceso?: Date;

  @Column({ name: 'user01_foto_perfil', type: 'varchar', length: 1000, nullable: true })
  fotoPerfil: string | null;

  @OneToOne(() => Persona, (persona) => persona.usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_user02' })
  persona: Persona;

  @OneToMany(() => DeviceToken, (deviceToken) => deviceToken.usuario)
  deviceTokens: DeviceToken[];

  @OneToMany(() => Notificacion, (notificacion) => notificacion.usuario)
  notificaciones: Notificacion[];

  static fromId(id: number) {
    const usuario = new Usuario();
    usuario.id = id;
    return usuario;
  }
}