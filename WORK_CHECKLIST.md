# Work Checklist - Hardening de plantilla API

Checklist operativo para ir marcando avances de mejora en la plantilla.

## Estado general

- [ ] P0 completado
- [ ] P1 completado
- [ ] P2 completado
- [ ] Plantilla lista para iniciar nuevos proyectos

---

## P0 - Critico (seguridad y estabilidad base)

### 1) Auditoria protegida

- [✅] Proteger `GET /audit` con `FlexibleJwtAuthGuard` en `src/schematics/audit/audit.controller.ts`
- [✅] Exigir rol admin para consultar auditoria (guard/politica)
- [✅] Validar en Swagger que `/audit` requiere bearer token
- [✅] Prueba manual: usuario no admin no puede consultar `/audit`
 
### 2) Configuracion TypeORM segura

- [✅] Cambiar `synchronize` para no usarlo fuera de local en `src/config/typeorm/data-source-local.ts`
- [✅] Mantener `DB_TIMEZONE` por env
- [✅] Verificar arranque correcto en `start:dev` luego del cambio

### 3) Secrets y configuracion sensible

- [✅] Revisar repo y quitar secretos reales de archivos versionados (`k8s/api-template.yaml` saneado, `Dockerfile` sin copiar JSON Firebase al layer)
- [ ] Confirmar rotacion de credenciales comprometidas (accion manual si alguna clave estuvo en git o en manifiestos viejos)
- [✅] Asegurar que no haya defaults inseguros de JWT en `auth.module/auth.service` (lectura via `src/config/auth-secrets.ts`)
- [✅] Fail-fast al arrancar si faltan variables criticas de auth (`src/config/validate-env.ts` + `main.ts`)

### 4) Plantilla de variables de entorno

- [✅] Crear/actualizar `.env.example` sin valores reales (raiz del repo)
- [✅] Incluir `DB_TIMEZONE`, JWT, SMTP, R2, `AUTH_API_URL` y Firebase (si aplica)
- [✅] Validar que un dev nuevo pueda levantar con `.env.example` + datos locales (copiar a `.env`, completar MySQL y secretos >= 16 chars; ver `README.md` raíz)

---

## P1 - Importante (operacion y observabilidad)

### 5) Rate limiting en autenticacion

- [ ] Integrar throttling en endpoints criticos de auth (`login`, `refresh`, `verify`, `resend`)
- [ ] Definir limites por ambiente (dev/stage/prod)
- [ ] Pruebas manuales de bloqueo por exceso de intentos

### 6) Logging seguro

- [ ] Redactar datos sensibles en `src/middlewares/log-middleware.ts`
- [ ] Redactar headers/body sensibles en `src/exceptions/http.exception.ts`
- [ ] Evitar stack traces y payload completo en produccion
- [ ] Verificar que los logs sigan siendo utiles para debug

### 7) Swagger consistente 

- [✅] Unificar bearer name en toda la API (ej. `authorization`)
- [✅] Revisar que todos los endpoints importantes tengan `ApiOperation`, `ApiOkResponse`, `ApiBadRequestResponse`
- [✅] Agregar `ApiUnauthorizedResponse` en endpoints protegidos

### 8) CI minimo

- [ ] Crear workflow CI (`lint`, `test`, `build`) — opcional; workflow de GitHub Actions retirado de la plantilla
- [ ] Asegurar que la rama principal quede protegida por checks
- [ ] Confirmar que falla merge cuando falla pipeline

---

## P2 - Mejora continua (calidad de plantilla)

### 9) Testing funcional real

- [ ] Reemplazar test demo por e2e reales de `auth`, `usuario`, `audit`
- [ ] Agregar unit tests en servicios criticos (`auth.service`, `usuario.service`, `audit.subscriber`)
- [ ] Definir cobertura minima objetivo

### 10) Documentacion raiz

- [✅] Mejorar `README.md` raiz con quickstart real
- [✅] Documentar flujo de creacion de modulo usando reglas `rules/*.mdc`
- [✅] Agregar seccion de troubleshooting comun

### 11) Configuracion centralizada

- [ ] Crear esquema de validacion de env (Joi/Zod)
- [ ] Mover lecturas directas de `process.env` a config central por dominio
- [ ] Validar error claro al iniciar si hay variables invalidas

### 12) Auditoria a escala (opcional)

- [ ] Revisar estrategia de retencion de `audit_log`
- [ ] Evaluar indices utiles para filtros de auditoria
- [ ] Optimizar enriquecimiento de usuario en auditoria (cache/batch) si aplica

---

## Checklist de cierre

- [ ] `yarn lint` sin errores
- [ ] `yarn build` exitoso
- [ ] `yarn test` exitoso
- [ ] Endpoints criticos validados manualmente
- [ ] Documentacion actualizada
- [ ] Backlog de pendientes actualizado

---

## Notas de avance

### Fecha:

### Responsable:

### Cambios realizados:

- 

### Bloqueos:

- 

### Proximo paso:

- 
