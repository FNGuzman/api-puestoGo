import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DeviceToken } from '../entities/device-token.entity';

@Injectable()
export class DeviceTokenRepository extends Repository<DeviceToken> {
  constructor(private dataSource: DataSource) {
    super(DeviceToken, dataSource.createEntityManager());
  }

  /** Obtiene todos los tokens FCM activos de un usuario (puede tener varios dispositivos). */
  async findTokensByUsuarioId(usuarioId: number): Promise<DeviceToken[]> {
    return this.find({
      where: { usuario: { id: usuarioId } },
      order: { updatedAt: 'DESC' },
    });
  }

  /** Busca un registro por usuario y token (para evitar duplicados al registrar). */
  async findOneByUsuarioAndToken(
    usuarioId: number,
    fcmToken: string,
  ): Promise<DeviceToken | null> {
    return this.findOne({
      where: { usuario: { id: usuarioId }, fcmToken },
    });
  }

  /** Obtiene todos los tokens FCM registrados (para broadcast ej. nueva versión de la app). */
  async findAllFcmTokens(): Promise<string[]> {
    const list = await this.find({ select: ['fcmToken'] });
    return list.map((t) => t.fcmToken).filter(Boolean);
  }

  /** Obtiene los IDs de usuarios que tienen al menos un token (para historial en sendToAllUsers). */
  async findDistinctUsuarioIds(): Promise<number[]> {
    const rows = await this.createQueryBuilder('dt')
      .select('DISTINCT dt.rela_pers01', 'usuarioId')
      .getRawMany<{ usuarioId: number }>();
    return rows.map((r) => r.usuarioId).filter((id) => id != null);
  }
}
