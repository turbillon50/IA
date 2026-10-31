# Integración web — 31 de octubre de 2026

La aplicación Next está en el proyecto existente `iaapp-web`; `iaapp-design` conserva la referencia visual. No confundir un despliegue READY con una conexión real de cuentas.

## Implementado

- ClerkProvider y middleware condicionales, entrada `/sign-in`.
- Repositorio por solicitud: sesión actual, `/me`, pertenencia al espacio y Authorization Bearer. Nunca hay un repositorio autenticado global.
- Proxy de mismo origen limitado a rutas de la API. Las mutaciones rechazan un origen distinto; el backend mantiene su autorización por recurso. Tokens y cookies no se exponen en DTOs.
- Envío a la sala con idempotencia estable para reintentar el mismo contenido. El borrador se conserva ante fallos; solo se anuncia Guardado tras respuesta exitosa.
- Actualización cada cinco segundos cuando la pestaña está visible, al recuperar red y al volver a la pestaña.
- Carga, error y entrada a sesión. Una falla de datos reales nunca activa ejemplos.

## Configuración pendiente comprobada

La inspección de Vercel encontró cero variables en `iaapp-web` y `iaapp-design`. No se extrajeron ni copiaron credenciales de otros proyectos.

En `iaapp-web`: `IAAPP_API_BASE` (HTTPS terminado en `/api/v1`), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`; opcional `IAAPP_WORKSPACE_ID` (se valida contra `/me`). Configurar el dominio del sitio en Clerk. Sin IAAPP_API_BASE se conserva la demostración rotulada.

En el servicio API: `IAAPP_DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_ISSUER`, `CLERK_CLIENT_ID`, `IAAPP_ALLOWED_ORIGINS`; opcional `CLERK_AUDIENCE`. Aplicar migraciones y crear el primer espacio/membresía con el procedimiento administrativo del backend. No existe un alta pública automática de propietarios.

## No terminado

No se ha probado una sesión Clerk real, Postgres remoto ni intercambio ChatGPT. Faltan paginación/cursores en UI, selección de destinatarios IA, grupos nuevos, proyectos, memoria, invitaciones, archivos, PWA instalable y revisión visual completa. El envío actual dirige el mensaje a la sala sin invocar IAs. Los pendientes de persistencia MCP siguen en INTEGRATION_STATUS.md.

El build local encuentra `ENOENT uv_resident_set_memory` en este entorno. El despliegue remoto debe compilar correctamente antes de activar esta entrega. CI ahora incluye typecheck y build web además de las comprobaciones del backend.
