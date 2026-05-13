/**
 * Configuración de Firebase (Admin SDK) para FCM.
 * Usado por el módulo de notificaciones para enviar push.
 *
 * Variables de entorno:
 * - GOOGLE_APPLICATION_CREDENTIALS: ruta al JSON de la cuenta de servicio (recomendado)
 * - FIREBASE_PROJECT_ID: ID del proyecto (opcional si viene en el JSON)
 * - FIREBASE_SERVICE_ACCOUNT_JSON: contenido del JSON en base64 o string (alternativa al archivo)
 */
export const FIREBASE_CONFIG = {
  /** Ruta al archivo JSON de la cuenta de servicio (prioridad si existe). */
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,

  /**
   * JSON de la cuenta de servicio como string (para entornos donde no se usa archivo).
   * Puede ser el JSON completo o base64 del JSON.
   */
  serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,

  /** ID del proyecto de Firebase (opcional si está en el JSON). */
  projectId: process.env.FIREBASE_PROJECT_ID,

  /** Si está en false, no se inicializa Firebase y los envíos se omiten (útil en desarrollo sin credenciales). */
  enabled: process.env.FIREBASE_ENABLED !== 'false',
};
