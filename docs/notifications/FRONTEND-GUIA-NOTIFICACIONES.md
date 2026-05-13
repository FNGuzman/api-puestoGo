# Guía frontend: notificaciones push (FCM) – api-oficios

Instructivo para integrar en la app el registro del token FCM, el manejo de las notificaciones que envía el backend y la sincronización con el historial persistido (tabla de notificaciones).

---

## 1. Requisitos previos

- El backend está configurado con **un proyecto de Firebase**. La app debe usar **el mismo proyecto** (mismo proyecto en [Firebase Console](https://console.firebase.google.com)).
- El usuario debe poder **iniciar sesión** y obtener un **JWT** que se envía en las peticiones (header `Authorization: Bearer <JWT>`).

---

## 2. Flujo backend: persistencia + push

El backend cumple el flujo acordado:

1. **Crear la notificación en la base de datos** (tabla de notificaciones: usuario, tipo, título, cuerpo, payload).
2. **Enviar la notificación push con Firebase** al dispositivo del usuario.
3. Cuando el usuario **marca como leída** la notificación, el backend actualiza `leido` y `leido_en` (vía **PATCH /notifications/:id/read**).
4. El **historial** se obtiene con **GET /notifications** (paginado, ordenado por fecha descendente).

Detalle técnico: en cada push, el backend incluye en `data` el campo **`notificacionId`** (ID de la fila en BD) para que la app pueda marcar como leída al abrir la notificación.

---

## 3. Configuración Firebase en la app

### Archivos de configuración

- **Android:** `google-services.json` (descargado desde Firebase Console, mismo proyecto que el backend), en la raíz del módulo app (ej. `android/app/google-services.json`).
- **iOS:** `GoogleService-Info.plist` en el proyecto Xcode.
- **Web:** Objeto `firebaseConfig` de Firebase Console al registrar la app Web.

No es necesario que el backend proporciones estos archivos; se generan en Firebase al registrar la app cliente.

### Obtener el token FCM

El **token FCM** lo genera el **SDK de Firebase en la app** (no el backend). Ejemplos:

- **Android (Kotlin):** `FirebaseMessaging.getInstance().token.addOnCompleteListener { ... task.result }`
- **iOS (Swift):** `Messaging.messaging().token { token, error in ... }`
- **Web:** `getToken(messaging, { vapidKey: '...' })`

Ese string es el **`fcmToken`** que se envía al backend en **POST /notifications/device-token**.

---

## 4. Registrar el token en el backend

### Cuándo registrar

| Momento | Acción |
|--------|--------|
| Tras login exitoso | Obtener token FCM y llamar a **POST /notifications/device-token** con el JWT. |
| Al abrir la app con sesión ya iniciada | Refrescar token FCM si hace falta y volver a registrar. |
| Cuando FCM devuelve un token nuevo | (Android: `onNewToken`; iOS: `didReceiveRegistrationToken`) Si hay usuario logueado, enviar el nuevo token a **POST /notifications/device-token**. |

**Solo registrar cuando haya usuario autenticado** (JWT válido).

### Endpoint y body

```http
POST /notifications/device-token
Authorization: Bearer <JWT>
Content-Type: application/json
```

**Body (JSON):**

| Campo       | Tipo   | Obligatorio | Descripción |
|------------|--------|-------------|-------------|
| `fcmToken`| string | Sí          | Token obtenido del SDK de Firebase. |
| `platform`| string | No          | `"android"` \| `"ios"` \| `"web"`. Por defecto: `"android"`. |
| `deviceId`| string | No          | Identificador del dispositivo (ej. modelo). |
| `deviceName`| string | No         | Nombre legible del dispositivo (opcional). |

**Ejemplo:**

```json
{
  "fcmToken": "dG9rZW4tZmlyZWJhc2Ut...",
  "platform": "android",
  "deviceId": "Pixel 6 - Android 14"
}
```

**Respuesta:** `200 OK` con `{ "message": "Token registrado correctamente" }`.

---

## 5. Recibir y manejar las notificaciones push

El backend envía en cada push:

- **Título y cuerpo:** para la bandeja del sistema (app en segundo plano o cerrada).
- **`data`:** objeto con `type`, `notificacionId` y datos extra (ej. `solicitud_id`, `booking_id`) para navegar y marcar como leída.

Comportamiento recomendado:

| Estado de la app | Qué hacer |
|------------------|-----------|
| **App en primer plano** | Mostrar notificación in-app o toast; al tocar, navegar según `data` y marcar como leída. |
| **App en segundo plano o cerrada** | El sistema muestra la notificación; al tocar, abrir la app, navegar según `data` y marcar como leída. |

En todos los casos:

1. Leer **`data`** (sobre todo `type` y `notificacionId`).
2. Navegar a la pantalla que corresponda según el tipo.
3. **Marcar como leída** llamando a **PATCH /notifications/:id/read** con el `notificacionId` de `data` (ver sección 7).

---

## 6. Marcar notificación como leída

Cuando el usuario **abre** la notificación (tap) o **la ve en el historial**, la app debe marcar como leída para mantener el estado en el backend y poder resaltar “no leídas” en el historial.

**Endpoint:**

```http
PATCH /notifications/:id/read
Authorization: Bearer <JWT>
```

- **`:id`** = `notificacionId` que viene en **`data.notificacionId`** del push (o el `id` de cada ítem en **GET /notifications**).
- Solo se pueden marcar notificaciones del usuario autenticado.

**Respuesta:** `200 OK` con `{ "leido": true }`.

**Cuándo llamar:**

- Al recibir el evento “usuario tocó la notificación” (payload de FCM con `data.notificacionId`).
- Opcional: al abrir la pantalla de detalle de una notificación desde el historial (usando el `id` de esa notificación).

---

## 7. Tipos de notificación y qué hacer en la app

El backend envía en `data` un campo **`type`** (y en todos los pushes incluye **`notificacionId`**). Según el tipo, pueden venir más campos.

| type | Cuándo | Campos útiles en `data` | Acción en la app |
|------|--------|--------------------------|------------------|
| **nueva_solicitud** | Un cliente realizó una solicitud de servicio (va al trabajador). | `solicitud_id` | Navegar a detalle de solicitud o listado de solicitudes. |
| **contrapropuesta** | El trabajador envió una contrapropuesta (va al cliente). | `solicitud_id`, `contrapropuesta_id` (si aplica) | Navegar a contrapropuestas o detalle de la solicitud. |
| **confirmacion** | Se confirmó la cita/servicio. | `solicitud_id`, `booking_id` (si aplica) | Navegar a “Mis citas” o detalle de la solicitud. |
| **recordatorio** | Recordatorio de cita próxima. | `booking_id`, `solicitud_id`, `inicio` | Navegar a detalle de la cita o solicitud. |
| **en_camino** | El trabajador marcó “en camino” (va al cliente). | `booking_id`, `solicitud_id` | Navegar a detalle de la cita/solicitud o pantalla de seguimiento. |
| **nueva_version** | Hay una nueva versión de la app. | `version` (opcional) | Mostrar mensaje o diálogo para actualizar (enlace a Store si aplica). |
| **otro** | Tipo genérico. | Los que envíe el backend | Mostrar mensaje o pantalla genérica. |

En **todos** los casos: después de navegar (o al abrir la notificación), llamar a **PATCH /notifications/:id/read** con `data.notificacionId`.

---

## 8. Historial de notificaciones

**Endpoint:**

```http
GET /notifications?pageNumber=1&pageSize=20&soloNoLeidas=false
Authorization: Bearer <JWT>
```

**Query params (todos opcionales):**

| Parámetro     | Tipo    | Descripción |
|---------------|---------|-------------|
| `pageNumber`  | number  | Página (por defecto 1). |
| `pageSize`    | number  | Tamaño de página (por defecto según backend). |
| `soloNoLeidas`| boolean | Si es `true`, solo devuelve notificaciones no leídas. |

**Respuesta:** Objeto paginado con `data` (lista de notificaciones) y `metadata` (count, pageSize, pageNumber, etc.). Cada ítem incluye:

- `id`, `tipo`, `titulo`, `cuerpo`, `payloadJson`, `leido`, `leidoEn`, `createdAt`, `updatedAt`.

En el historial se puede **resaltar** las que tienen `leido === false` (o `leidoEn === null`). Al abrir una desde el historial, llamar a **PATCH /notifications/:id/read** con ese `id`.

---

## 9. Resumen de pasos por plataforma

### Android

1. Añadir `google-services.json` y dependencia de Firebase Messaging.
2. Obtener token FCM; registrar en **POST /notifications/device-token** tras login o al abrir con sesión.
3. En **FirebaseMessagingService**: en `onMessageReceived` manejar `data`; al tocar la notificación, abrir la pantalla según `data.type` y llamar **PATCH /notifications/:id/read** con `data.notificacionId`.
4. En **onNewToken**, si hay usuario logueado, volver a llamar a **POST /notifications/device-token**.

### iOS

1. Añadir `GoogleService-Info.plist` y habilitar Push Notifications.
2. Obtener token FCM; registrar en el backend tras login o al abrir con sesión.
3. En el delegate de notificaciones: al recibir la push y al tocar, leer `data`, navegar según `type` y llamar **PATCH /notifications/:id/read** con `data.notificacionId`.
4. En **didReceiveRegistrationToken**, si hay usuario logueado, volver a registrar el token.

### Web

1. Registrar la app Web en Firebase y usar `firebaseConfig` en el código.
2. Obtener token con `getToken()`; registrar en el backend tras login o al cargar con sesión.
3. En el handler de **onMessage**, mostrar la notificación y, al hacer clic, navegar según `data.type` y llamar **PATCH /notifications/:id/read** con `data.notificacionId`.

---

## 10. Buenas prácticas

- **Solo registrar token con sesión:** Enviar el token a **POST /notifications/device-token** solo cuando el usuario esté logueado (JWT válido).
- **Marcar como leída:** Siempre que el usuario abra una notificación (desde push o desde el historial), llamar a **PATCH /notifications/:id/read** para mantener el estado en el backend.
- **Navegación por `data`:** Usar `data.type` y los IDs en `data` (solicitud_id, booking_id, etc.) para la ruta; no depender solo del título o cuerpo.
- **Reintentos:** Si **POST /notifications/device-token** falla, no bloquear la app; reintentar en segundo plano o en el próximo arranque.
