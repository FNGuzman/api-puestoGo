import { Injectable } from '@nestjs/common';
import { DeviceTokenRepository } from './repository/device-token.repository';
import { NotificacionRepository } from './repository/notificacion.repository';
import { FirebaseService } from './firebase.service';
import { DevicePlatform } from './entities/device-token.entity';
import { FcmMessagePayload } from './firebase.service';
import { TipoNotificacionEnum } from 'src/common/enums/tipo-notificacion-enum';
import { SearchNotificacionRequestDto } from './dto/search-notificacion-request.dto';
import { PageDto } from 'src/common/dto/page.dto';
import { NotificacionDTO } from './dto/notificacion.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class NotificationsService {
  constructor(
    private deviceTokenRepository: DeviceTokenRepository,
    private notificacionRepository: NotificacionRepository,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Registra o actualiza el token FCM de un usuario.
   * Si ya existe el mismo token para el usuario, actualiza platform/deviceId y updatedAt.
   */
  async registerDeviceToken(
    usuarioId: number,
    fcmToken: string,
    platform: DevicePlatform = 'android',
    deviceId?: string | null,
    deviceName?: string | null,
  ): Promise<void> {
    const existing = await this.deviceTokenRepository.findOneByUsuarioAndToken(
      usuarioId,
      fcmToken,
    );
    if (existing) {
      existing.platform = platform;
      if (deviceId !== undefined) existing.deviceId = deviceId ?? null;
      if (deviceName !== undefined) existing.deviceName = deviceName ?? null;
      await this.deviceTokenRepository.save(existing);
      return;
    }
    const token = this.deviceTokenRepository.create({
      usuario: { id: usuarioId } as any,
      fcmToken,
      platform,
      deviceId: deviceId ?? null,
      deviceName: deviceName ?? null,
    });
    await this.deviceTokenRepository.save(token);
  }

  /**
   * Persiste una notificación en el historial del usuario (sin enviar FCM).
   * El tipo se toma de payload.data?.type; si no es un valor del enum, se usa BIENVENIDA por defecto.
   * Retorna el id de la notificación creada para incluir en el payload FCM (notificacionId).
   */
  private async persistNotification(
    usuarioId: number,
    payload: Omit<FcmMessagePayload, 'token' | 'tokens'>,
  ): Promise<number> {
    const rawType = payload.data?.type;
    const tipo =
      rawType &&
      Object.values(TipoNotificacionEnum).includes(
        rawType as TipoNotificacionEnum,
      )
        ? (rawType as TipoNotificacionEnum)
        : TipoNotificacionEnum.OTRO;
    const notificacion = this.notificacionRepository.create({
      usuario: { id: usuarioId } as any,
      tipo,
      titulo: payload.title ?? null,
      cuerpo: payload.body ?? null,
      payloadJson: payload.data ?? null,
      leido: false,
    });
    const saved = await this.notificacionRepository.save(notificacion);
    return saved.id;
  }

  /** Incluye notificacionId en data para que la app pueda marcar como leída al abrir desde el push. */
  private payloadWithNotificacionId(
    payload: Omit<FcmMessagePayload, 'token' | 'tokens'>,
    notificacionId: number,
  ): Omit<FcmMessagePayload, 'token' | 'tokens'> {
    return {
      ...payload,
      data: { ...payload.data, notificacionId: String(notificacionId) },
    };
  }

  /**
   * Envía una notificación push a todos los dispositivos de un usuario.
   * Persiste la notificación en el historial e incluye notificacionId en el payload para que la app pueda marcar como leída al abrir desde el push.
   */
  async sendToUser(
    usuarioId: number,
    payload: Omit<FcmMessagePayload, 'token' | 'tokens'>,
  ): Promise<number> {
    const notificacionId = await this.persistNotification(usuarioId, payload);
    const tokens =
      await this.deviceTokenRepository.findTokensByUsuarioId(usuarioId);
    const fcmTokens = tokens.map((t) => t.fcmToken).filter(Boolean);
    if (fcmTokens.length === 0) return 0;
    const payloadWithId = this.payloadWithNotificacionId(
      payload,
      notificacionId,
    );
    return this.firebaseService.sendToTokens({
      ...payloadWithId,
      tokens: fcmTokens,
    });
  }

  /**
   * Envía la misma notificación a varios usuarios (ej. alerta de mascota perdida cercana).
   * Persiste una notificación por usuario e incluye notificacionId en cada envío para que la app pueda marcar como leída al abrir desde el push.
   * Envía por usuario para que cada uno reciba su propio notificacionId.
   */
  async sendToUsers(
    usuarioIds: number[],
    payload: Omit<FcmMessagePayload, 'token' | 'tokens'>,
  ): Promise<number> {
    if (usuarioIds.length === 0) return 0;
    let totalSent = 0;
    for (const uid of usuarioIds) {
      const notificacionId = await this.persistNotification(uid, payload);
      const tokens =
        await this.deviceTokenRepository.findTokensByUsuarioId(uid);
      const fcmTokens = tokens.map((t) => t.fcmToken).filter(Boolean);
      if (fcmTokens.length === 0) continue;
      const payloadWithId = this.payloadWithNotificacionId(
        payload,
        notificacionId,
      );
      totalSent += await this.firebaseService.sendToTokens({
        ...payloadWithId,
        tokens: fcmTokens,
      });
    }
    return totalSent;
  }

  /**
   * Alertas de mascota perdida a usuarios cercanos (reemplaza sendNearbyPetAlert del módulo antiguo).
   */
  async sendNearbyPetAlert(
    usuarioIds: number[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<number> {
    return this.sendToUsers(usuarioIds, { title, body, data });
  }

  /**
   * Envía la misma notificación a todos los dispositivos registrados (broadcast).
   * Persiste una notificación por usuario e incluye notificacionId en cada envío.
   * Envía por usuario para que cada uno reciba su propio notificacionId (permite marcar como leída al abrir desde el push).
   */
  async sendToAllUsers(
    payload: Omit<FcmMessagePayload, 'token' | 'tokens'>,
  ): Promise<number> {
    const usuarioIds =
      await this.deviceTokenRepository.findDistinctUsuarioIds();
    let totalSent = 0;
    for (const uid of usuarioIds) {
      const notificacionId = await this.persistNotification(uid, payload);
      const tokens =
        await this.deviceTokenRepository.findTokensByUsuarioId(uid);
      const fcmTokens = tokens.map((t) => t.fcmToken).filter(Boolean);
      if (fcmTokens.length === 0) continue;
      const payloadWithId = this.payloadWithNotificacionId(
        payload,
        notificacionId,
      );
      totalSent += await this.firebaseService.sendToTokens({
        ...payloadWithId,
        tokens: fcmTokens,
      });
    }
    return totalSent;
  }

  /**
   * Notificación: nueva versión de la app disponible (a un usuario).
   */
  async notifyNuevaVersion(params: {
    usuarioId: number;
    version?: string;
    mensaje?: string;
  }): Promise<number> {
    return this.sendToUser(params.usuarioId, {
      title: 'Nueva versión disponible',
      body:
        params.mensaje ??
        'Hay una nueva versión de iPet disponible. Actualiza para disfrutar de las mejoras.',
      data: {
        type: 'nueva_version',
        ...(params.version ? { version: params.version } : {}),
      },
    });
  }

  /**
   * Notificación: nueva versión de la app disponible (a todos los usuarios con token registrado).
   * Llamar al publicar o activar una nueva versión en version-movil.
   */
  async notifyNuevaVersionToAll(params: {
    version?: string;
    mensaje?: string;
  }): Promise<number> {
    return this.sendToAllUsers({
      title: 'Nueva versión disponible',
      body:
        params.mensaje ??
        'Hay una nueva versión de iPet disponible. Actualiza para disfrutar de las mejoras.',
      data: {
        type: 'ACTUALIZACION_APP',
        ...(params.version ? { version: params.version } : {}),
      },
    });
  }

  /**
   * Lista paginada de notificaciones del usuario autenticado.
   */
  async findPageByUsuarioId(
    usuarioId: number,
    request: SearchNotificacionRequestDto,
  ): Promise<PageDto<NotificacionDTO>> {
    const page = await this.notificacionRepository.findPageByUsuarioId(
      usuarioId,
      request,
    );
    page.metadata.setPaginationData(request.getPageNumber(), request.getTake());
    const dtos = page.data.map((n) =>
      plainToInstance(NotificacionDTO, n, { excludeExtraneousValues: true }),
    );
    const result = new PageDto<NotificacionDTO>(dtos, page.metadata.count);
    result.metadata.setPaginationData(
      request.getPageNumber(),
      request.getTake(),
    );
    return result;
  }

  /**
   * Marca una notificación como leída. Solo si pertenece al usuario.
   */
  async markAsRead(id: number, usuarioId: number): Promise<{ leido: boolean }> {
    const updated = await this.notificacionRepository.markAsRead(id, usuarioId);
    return { leido: updated };
  }
}
