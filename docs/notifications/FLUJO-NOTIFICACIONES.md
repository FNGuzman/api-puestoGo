# Flujo de notificaciones: requerimiento vs implementación

Este documento relaciona el **flujo de notificaciones** definido por el equipo con la **implementación** en el módulo `notifications` de api-oficios.

---

## 1. Resumen del flujo requerido

1. **Crear la notificación en la base de datos** (tabla de notificaciones).
2. **Enviar la notificación push al usuario con Firebase** (FCM).
3. El usuario puede **marcar como leída** (actualizar `noti01_leido_en` o equivalente).
4. **Mostrar el historial de notificaciones** consultando la base de datos (ordenado por fecha descendente, resaltar no leídas).

---

## 2. Correspondencia paso a paso

### 2.1 Creación de la notificación (Backend)

| Requerimiento | Implementación |
|---------------|----------------|
| Al ocurrir un evento (ej. cliente realiza solicitud), crear notificación en **Firebase y en la base de datos**. | `NotificationsService.sendToUser(usuarioId, payload)` hace exactamente eso: primero persiste en BD (`persistNotification`) y luego envía por FCM (`firebaseService.sendToTokens`). |
| Guardar en tabla: `rela_usua02`, `noti01_tipo`, `noti01_titulo`, `noti01_cuerpo`, `noti01_payload_json`, `noti01_leido_en` (NULL al crear). | La entidad usa la tabla **noti_02_mov_notificacion** con columnas equivalentes: `rela_usua02` → usuario, `noti02_tipo`, `noti02_titulo`, `noti02_cuerpo`, `noti02_payload_json`, `noti02_leido` (false al crear), `noti02_leido_en` (null al crear). Se persiste con `leido: false` y `leidoEn` no se setea (queda null). |
| Enviar push con FCM: título, cuerpo, `data` (payload). | `FirebaseService.sendToTokens` envía `title`, `body` y `data`; en `data` se incluye además `notificacionId` para que la app pueda marcar como leída al abrir desde el push. |

**Nota sobre nombres de tabla:** El flujo original menciona `noti_01_cab_notificaciones`. En esta API la entidad está mapeada a `noti_02_mov_notificacion`. La lógica es la misma; si en tu base de datos la tabla se llama de otra forma, basta con ajustar el `@Entity({ name: '...' })` en la entidad.

---

### 2.2 Estado de la notificación (leída / no leída)

| Requerimiento | Implementación |
|---------------|----------------|
| Cuando el usuario abre la notificación o accede al historial, actualizar `noti01_leido_en = NOW()`. | **PATCH /notifications/:id/read** (usuario autenticado). El repositorio actualiza `leido: true` y **`leidoEn: new Date()`**. Solo se actualiza si la notificación pertenece al usuario. |
| Saber si está "no leída": `noti01_leido_en IS NULL`. | En la implementación se usa además el campo booleano `leido`. Una notificación no leída tiene `leido === false` y `leidoEn === null`. El listado puede filtrar con `?soloNoLeidas=true`. |

---

### 2.3 Mostrar el historial de notificaciones

| Requerimiento | Implementación |
|---------------|----------------|
| Consultar notificaciones del usuario, orden por `created_at DESC`. | **GET /notifications** con paginación (`pageNumber`, `pageSize`). El repositorio ordena por `n.createdAt DESC`. |
| Resaltar no leídas en el UI. | Cada ítem del listado incluye `leido` y `leidoEn`. El frontend puede resaltar cuando `leido === false`. Opcional: **GET /notifications?soloNoLeidas=true** para traer solo no leídas. |

---

## 3. Uso desde otros módulos (eventos que disparan notificaciones)

Cuando ocurre un evento que debe notificar al usuario, se llama a `NotificationsService.sendToUser(usuarioId, payload)` (o `sendToUsers` para varios). Ejemplo:

```ts
await this.notificationsService.sendToUser(trabajadorUsuarioId, {
  title: 'Tienes una nueva solicitud de servicio',
  body: 'Un cliente ha solicitado un servicio.',
  data: {
    type: NotificacionTipoEnum.NUEVA_SOLICITUD,
    solicitud_id: String(solicitudId),
    rubro: 'electricista',
  },
});
```

- **Persistencia:** Se guarda en la tabla de notificaciones (usuario, tipo, título, cuerpo, payload).
- **Push:** Se envía por FCM a todos los tokens registrados de ese usuario.
- **notificacionId:** Se añade automáticamente en `data.notificacionId` para que la app pueda llamar a **PATCH /notifications/:id/read** cuando el usuario abra la notificación.

---

## 4. Tipos de notificación (enum)

Los tipos definidos en `NotificacionTipoEnum` y usados en la API son:

- `nueva_solicitud` — Nueva solicitud de servicio para el trabajador.
- `contrapropuesta` — El trabajador envió una contrapropuesta (cliente).
- `confirmacion` — Confirmación de cita/servicio.
- `recordatorio` — Recordatorio de cita próxima.
- `en_camino` — El trabajador está en camino (cliente).
- `codigo` — Código u otro uso.
- `otro` — Fallback cuando el tipo no coincide.

---

## 5. Resumen de endpoints

| Método y ruta | Descripción |
|----------------|-------------|
| **POST /notifications/device-token** | Registrar token FCM del dispositivo (requerido para recibir push). |
| **GET /notifications** | Historial paginado del usuario. Query: `pageNumber`, `pageSize`, `soloNoLeidas` (opcional). |
| **PATCH /notifications/:id/read** | Marcar una notificación como leída (actualiza `leido` y `leidoEn`). |

El frontend debe registrar el token al iniciar sesión o al abrir la app con sesión, y al recibir o abrir una notificación puede llamar a **PATCH /notifications/:id/read** usando el `notificacionId` que viene en `data` del push.
