import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { FIREBASE_CONFIG } from 'src/config/firebase.config';

export interface FcmMessagePayload {
  /** Token(s) FCM del dispositivo. */
  token?: string;
  tokens?: string[];
  /** Título de la notificación (opcional; en data se puede enviar todo). */
  title?: string;
  /** Cuerpo del mensaje. */
  body?: string;
  /** Datos custom para la app (ej. tipo, id de cofre, etc.). */
  data?: Record<string, string>;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (FIREBASE_CONFIG.enabled === false) {
      this.logger.warn('Firebase está deshabilitado (FIREBASE_ENABLED=false). No se enviarán notificaciones push.');
      return;
    }

    try {
      if (admin.apps.length > 0) {
        this.initialized = true;
        this.logger.log('Firebase Admin ya estaba inicializado.');
        return;
      }

      const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') ?? FIREBASE_CONFIG.credentialsPath;
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID') ?? FIREBASE_CONFIG.projectId;
      const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON') ?? FIREBASE_CONFIG.serviceAccountJson;

      let credential: admin.credential.Credential;

      if (serviceAccountJson) {
        try {
          let jsonStr: string = serviceAccountJson.trim();
          if (!jsonStr.startsWith('{')) {
            const candidates: string[] = path.isAbsolute(jsonStr)
              ? [jsonStr]
              : [
                  path.resolve(process.cwd(), jsonStr),
                  path.resolve(process.cwd(), '..', jsonStr),
                  path.resolve(__dirname, '..', '..', jsonStr.replace(/^\.\//, '')),
                ];
            const filePath = candidates.find((p) => fs.existsSync(p));
            if (filePath) {
              jsonStr = fs.readFileSync(filePath, 'utf8');
            } else {
              try {
                jsonStr = Buffer.from(jsonStr, 'base64').toString('utf8');
              } catch {
                throw new Error(`Archivo no encontrado. Probadas: ${candidates.join(', ')}`);
              }
            }
          }
          if (jsonStr.startsWith('{')) {
            credential = admin.credential.cert(JSON.parse(jsonStr));
          } else {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON debe ser JSON, base64 o ruta a un archivo .json');
          }
        } catch (e) {
          this.logger.error(
            'Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON. Verifica que sea: JSON válido, base64, o ruta a un archivo .json.',
          );
          return;
        }
      } else if (credentialsPath) {
        credential = admin.credential.cert(credentialsPath);
      } else {
        credential = admin.credential.applicationDefault();
      }

      admin.initializeApp({
        credential,
        projectId: projectId || undefined,
      });
      this.initialized = true;
      this.logger.log('Firebase Admin SDK inicializado correctamente.');
    } catch (error) {
      this.logger.error('No se pudo inicializar Firebase Admin. Las notificaciones push no se enviarán.', error);
    }
  }

  /** Indica si FCM está listo para enviar mensajes. */
  isReady(): boolean {
    return this.initialized && admin.apps.length > 0;
  }

  /**
   * Envía un mensaje a un único token.
   * Si FCM no está inicializado, no hace nada y no lanza error.
   */
  async sendToToken(payload: FcmMessagePayload): Promise<string | null> {
    if (!this.isReady() || !payload.token) return null;
    try {
      const message: admin.messaging.Message = {
        token: payload.token,
        notification: payload.title || payload.body
          ? { title: payload.title ?? '', body: payload.body ?? '' }
          : undefined,
        data: payload.data
          ? Object.fromEntries(
              Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
            )
          : undefined,
        android: payload.title || payload.body
          ? { priority: 'high' as const, notification: { title: payload.title, body: payload.body } }
          : undefined,
        apns: payload.title || payload.body
          ? {
              payload: { aps: { alert: { title: payload.title, body: payload.body }, sound: 'default' } },
            }
          : undefined,
      };
      const messageId = await admin.messaging().send(message);
      this.logger.debug(`FCM enviado correctamente: ${messageId}`);
      return messageId;
    } catch (error: any) {
      if (error?.code === 'messaging/invalid-registration-token' || error?.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`Token FCM inválido o no registrado (el cliente debe actualizar): ${payload.token?.slice(0, 20)}...`);
      } else {
        this.logger.error('Error al enviar FCM:', error?.message ?? error);
      }
      return null;
    }
  }

  /**
   * Envía el mismo mensaje a varios tokens (multicast).
   * Retorna cantidad de envíos exitosos.
   */
  async sendToTokens(payload: Omit<FcmMessagePayload, 'token'> & { tokens: string[] }): Promise<number> {
    if (!this.isReady() || !payload.tokens?.length) return 0;
    let successCount = 0;
    const message: admin.messaging.MulticastMessage = {
      tokens: payload.tokens,
      notification: payload.title || payload.body
        ? { title: payload.title ?? '', body: payload.body ?? '' }
        : undefined,
      data: payload.data
        ? Object.fromEntries(
            Object.entries(payload.data).map(([k, v]) => [k, String(v)]),
          )
        : undefined,
      android: payload.title || payload.body
        ? { priority: 'high' as const, notification: { title: payload.title, body: payload.body } }
        : undefined,
      apns: payload.title || payload.body
        ? {
            payload: { aps: { alert: { title: payload.title, body: payload.body }, sound: 'default' } },
          }
        : undefined,
    };
    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      successCount = response.successCount;
      if (response.failureCount > 0) {
        response.responses.forEach((r, i) => {
          if (!r.success) {
            this.logger.warn(`FCM falló para token ${payload.tokens![i]?.slice(0, 20)}...: ${r.error?.message}`);
          }
        });
      }
    } catch (error: any) {
      this.logger.error('Error en multicast FCM:', error?.message ?? error);
    }
    return successCount;
  }
}
