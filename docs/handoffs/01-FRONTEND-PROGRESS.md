# Frontend — avance 1

Shell Next.js y conversación directa/grupo con componentes compartidos Avatar, Badge y EmptyState. El adaptador `ChatRepository` separa fixture y API. La fuente fixture está rotulada y no envía mensajes; el compositor conserva borrador local y se habilitará cuando exista sesión, permisos y endpoint comprobado. La API se activa solo con `IAAPP_API_BASE` e `IAAPP_WORKSPACE_ID`; un fallo real no cambia a fixtures.

Pendiente: S01 y S05–S15, búsqueda, selección de destinatarios, paginación, envíos y entregas reales, permisos del servidor, estados adicionales, service worker e iconos PWA. La ruta `/admin` no existe hasta contar con autorización del servidor.

Integración: el contrato actual `GET /workspaces/:id/rooms` y `GET /rooms/:id/messages` se consume como `CursorPage`; confirmar respuesta con `requestId` y mecanismo de sesión antes de activar API. No se modificó el contrato.

Verificación 30-oct-2026: `npm run typecheck` pasó. `npm run build` se detuvo en el entorno antes de compilar por `ENOENT uv_resident_set_memory` de Node/Next. No se obtuvieron capturas reales ni se confirmó el comportamiento a 360, 390, 768 y 1440 px en navegador; las reglas CSS están definidas para esos rangos y requieren inspección visual. No se probó dispositivo físico. El manifest es preparatorio, sin iconos ni service worker instalable.

Publicación: `vercel.json` raíz apunta al build Next; las referencias aprobadas siguen en `apps/web/public/index.html` y `screens.html`. El proyecto Vercel de diseño debe fijar `rootDirectory=prototype` para mantener su despliegue estático; el nuevo proyecto web usa la raíz. La interfaz en producción sigue en modo fixtures hasta que el backend real tenga sesión y recursos configurados.
