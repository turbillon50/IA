# Encargo C — Datos, REST y permisos

Repositorio `turbillon50/IA`. Contrato en `docs/API_CONTRACT.md` y `packages/contracts/domain.ts`. Tu alcance: `packages/db`, `apps/api/src/rest`, `apps/api/src/auth`. Coordina interfaces de persistencia con D; no modificar frontend ni contratos por tu cuenta.

Crear migraciones Postgres para entidades listadas. Implementar identidad externa, pertenencia de espacios/proyectos/salas, invitados, participantes humanos e IAs, mensajes con secuencia por sala, entregas, memoria versionada, tareas y archivos privados. Índices y límites según patrones de consulta.

Mensajes y outbox en una transacción. Idempotency-Key única por actor/sala con comparación del payload. Nunca aceptar sender/owner de un request como identidad autorizada. Clerk sub es texto externo; validar integración real con Supabase y no asumir auth.users UUID. Separar sesión PWA y OAuth MCP.

Todos los accesos comprueban tenant y recurso. RLS para accesos cliente; si el servidor usa service role, verificar permisos de forma explícita antes de cada operación. Canales Realtime privados y reconexión/revocación comprobadas. Storage privado con enlaces de corta duración y verificación de archivos subidos.

Pruebas obligatorias: dos propietarios y un tercero no miembro; mensajes, búsquedas, memoria y Storage sin fugas; mismo mensaje duplicado; secuencias concurrentes; cambios de versión; invitación expirada/reutilizada; rol retirado mientras hay un canal abierto.

Entregar: migraciones reproducibles, seed sintético, REST contra contrato, prueba de aislamiento y documentación de variables sin secretos. No crear entornos pagos sin necesidad ni inventar conexiones verificadas.
