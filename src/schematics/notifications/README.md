# Notificaciones (FCM + enfoque híbrido)

**Guía para el frontend:** qué hacer, cuándo y cómo registrar el token y manejar las notificaciones → **[FRONTEND-GUIA-NOTIFICACIONES.md](./FRONTEND-GUIA-NOTIFICACIONES.md)**.

---

## Por qué este enfoque

En **Android 13+** (y políticas similares en iOS), cuando el usuario bloquea el dispositivo o envía la app a segundo plano, las conexiones **WebSocket / Socket.io** se cierran. Por tanto, las notificaciones en tiempo real que dependan solo de WebSocket **no llegarán** cuando la app no está en primer plano.

La solución recomendada es un **sistema híbrido**:

| Tipo de notificación | Cuándo usarlo | Tecnología |
|----------------------|----------------|------------|
| **Push (app cerrada o en segundo plano)** | Invitación a cofre, alguien aceptó invitación, nueva versión disponible, recordatorios | **Firebase Cloud Messaging (FCM)** |
| **En tiempo real con app abierta** | Actualizar lista de cofres, ofertas/promos mientras el usuario está en la app | **Socket.io** (opcional, para implementar más adelante) |

Flujo recomendado: **WebSocket cuando la app está abierta** → **FCM cuando la app está en background/cerrada**. El backend envía tanto por FCM (para que llegue siempre) como por Socket.io si hay conexión activa; la app puede decidir no mostrar duplicados.

---

## Firebase Admin SDK vs API HTTP v1 de FCM

- **Firebase Admin SDK** (lo que usamos aquí): biblioteca oficial para Node.js. Se encarga de la autenticación con Google, construcción del mensaje y envío. Es la opción recomendada para un backend Nest/Node.
- **API HTTP v1 de FCM**: es la API REST “en crudo”. Tú gestionas el token OAuth y el cuerpo de la petición. Da más control pero más código y mantenimiento.

Para este backend usamos **Firebase Admin SDK** (`firebase-admin`).

---

## Qué debes hacer en la web de Firebase

1. **Crear proyecto (si no tienes uno)**  
   - [Firebase Console](https://console.firebase.google.com/) → Crear proyecto (o usar uno existente).

2. **Registrar la app cliente (Android / iOS / Web)**  
   - En el proyecto: “Agregar app” → Android / iOS / Web.  
   - Sigue los pasos (nombre del paquete, descarga de `google-services.json` / `GoogleService-Info.plist`, etc.).  
   - La app móvil usará estos archivos para obtener el **token FCM** y enviarlo al backend.

3. **Obtener credenciales del servidor (cuenta de servicio)**  
   - En Firebase: **Configuración del proyecto** (engranaje) → **Cuentas de servicio**.  
   - “Generar nueva clave privada” → descargar el JSON.  
   - **Nunca** subas este JSON a repositorios públicos. Guárdalo en un lugar seguro (por ejemplo solo en el servidor o en variables de entorno).

4. **Configurar el backend**  
   Añade en tu `.env` (o variables de entorno del servidor):

   - **Opción A** – ruta al JSON de la cuenta de servicio:
     ```env
     GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\al\proyecto-firebase-adminsdk-xxxxx.json
     ```
   - **Opción B** – contenido del JSON en una variable (útil en algunos clouds):
     ```env
     FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
     ```
   - Opcional: `FIREBASE_PROJECT_ID=tu-project-id` si no viene en el JSON.  
   - Para desactivar FCM en desarrollo sin credenciales: `FIREBASE_ENABLED=false`.

5. **Crear la tabla de tokens en la base de datos**  
   - La entidad es `DeviceToken` (tabla `notif_01_device_token`).  
   - Ejecuta las migraciones de TypeORM o sincroniza el esquema para crear la tabla.

---

## Uso en el backend

- **Registro de token FCM**  
  La app debe llamar a `POST /notifications/device-token` (con JWT) al iniciar sesión o cuando obtenga un nuevo token FCM, enviando:

  - `fcmToken`: token que devuelve el SDK de Firebase en la app.  
  - Opcional: `platform` (`android` | `ios` | `web`), `deviceId`.

- **Envío de notificaciones**  
  Desde cualquier servicio inyecta `NotificationsService` y usa, por ejemplo:

  - `notifyInvitacionCofre({ usuarioIdDestino, nombreCofre, nombreInvitador, cofreId })`
  - `notifyInvitacionAceptada({ usuarioIdDestino, nombreInvitado, nombreCofre, cofreId })`
  - `notifyNuevaVersion({ usuarioId, version?, mensaje? })`

  O genérico: `sendToUser(usuarioId, { title, body, data })`.

---

## Estructura de la carpeta

- `config/` (en `src/config`): `firebase.config.ts` – variables de entorno para Firebase.
- `entities/`: `device-token.entity.ts` – tabla de tokens FCM por usuario.
- `repository/`: `device-token.repository.ts`.
- `firebase.service.ts`: inicialización de Firebase Admin y envío de mensajes FCM.
- `notifications.service.ts`: registro de tokens y métodos de notificación (invitación, invitación aceptada, nueva versión).
- `notifications.controller.ts`: `POST /notifications/device-token`.
- `dto/`: DTOs para el registro del token.

---

## Socket.io (futuro)

Para notificaciones **solo cuando la app está abierta** (por ejemplo actualización de lista de cofres sin recargar), se puede añadir un módulo Socket.io que:

- Use el mismo JWT para autenticar la conexión.
- Emita eventos por `usuarioId` (ej. `invitacion-cofre`, `invitacion-aceptada`).
- La app escuche esos eventos y actualice la UI; FCM sigue siendo el canal para cuando la app está en background o cerrada.
