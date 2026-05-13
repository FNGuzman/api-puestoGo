import { BaseEntity } from 'src/common/models/baseentity';
import { Usuario } from 'src/schematics/usuario/entities/usuario.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

/** Plataforma del dispositivo para segmentar o personalizar mensajes. */
export type DevicePlatform = 'android' | 'ios' | 'web';

@Entity('noti_01_device_token')
export class DeviceToken extends BaseEntity {

  @ManyToOne(() => Usuario, (usuario) => usuario.deviceTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rela_usua02' })
  usuario: Usuario;

  /** Token FCM del dispositivo (único por app instalación). */
  @Column({ name: 'notif01_fcm_token', type: 'varchar', length: 500 })
  fcmToken: string;

  /** Plataforma para posibles personalizaciones (android, ios, web). */
  @Column({ name: 'notif01_platform', type: 'varchar', length: 20, default: 'android' })
  platform: DevicePlatform;

  /** Identificador opcional del dispositivo (ej. nombre o modelo) para depuración. */
  @Column({ name: 'notif01_device_id', type: 'varchar', length: 255, nullable: true })
  deviceId: string | null;

  /** Nombre del dispositivo para depuración. */
  @Column({ name: 'notif01_device_name', type: 'varchar', length: 255, nullable: true })
  deviceName: string | null;

  static fromId(id: number): DeviceToken {
    const e = new DeviceToken();
    e.id = id;
    return e;
  }
}
