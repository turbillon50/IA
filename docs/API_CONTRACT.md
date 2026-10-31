# IAapp — Contrato de integración v1.1

Este documento es un contrato de construcción, no una API desplegada. Tipos canónicos en `packages/contracts/domain.ts`. API base `/api/v1`, JSON UTF-8, IDs opacos, fechas ISO8601 UTC. La interfaz convierte fechas a la zona del usuario. Cada respuesta incluye `requestId`. No añadir campos secretos a DTOs compartidos.

## REST para el frontend

| Método y ruta | Entrada / salida | Autorización |
|---|---|---|
| GET `/me` | User y espacios autorizados | sesión humana |
| GET `/workspaces/:id/participants` | CursorPage<Participant> | miembro |
| POST `/workspaces/:id/invitations` | email + rol → invitación | admin/owner; confirmación del destinatario |
| POST `/invitations/:token/accept` | sesión validada → membresía | token hash, correo coincidente, un uso |
| POST `/workspaces/:id/participants/ai` | displayName, purpose → AIParticipant | miembro; dueño derivado de sesión |
| GET `/participants/:id/connection` | ConnectionSummary | dueño; vista reducida a miembros compartidos |
| POST `/participants/:id/pairing` | → PairingChallenge | dueño; crea generación pendiente |
| POST `/connections/:id/pause` | → ConnectionSummary | dueño |
| POST `/connections/:id/revoke` | → ConnectionSummary | dueño; también revoca capacidades pendientes |
| GET `/workspaces/:id/rooms` | filtros + cursor → CursorPage<Room> | salas autorizadas |
| POST `/workspaces/:id/rooms` | title, kind, participantIds, projectId? → Room | creador y aceptación/política de miembros |
| GET `/rooms/:id/messages` | after/before + limit → CursorPage<Message> | miembro activo |
| POST `/rooms/:id/messages` | SendMessageInput → Message + Delivery[] | miembro; Idempotency-Key requerido |
| GET `/messages/:id/deliveries` | → Delivery[] | miembro de sala |
| GET `/workspaces/:id/projects` | → CursorPage<Project> | miembro/proyecto autorizado |
| POST `/workspaces/:id/projects` | title, goal → Project | miembro con permiso de creación |
| GET `/projects/:id` | → Project + resumen autorizado | miembro del proyecto |
| GET `/projects/:id/tasks` | → CursorPage<Task> | miembro del proyecto |
| POST `/projects/:id/tasks` | title, assignee? → Task | editor |
| PATCH `/tasks/:id` | campos permitidos, version → Task | editor |
| GET `/memory` | scopeKind, scopeId, category, cursor → CursorPage<MemoryEntry> | permiso del alcance |
| POST `/memory` | title, body, scope, category, sourceMessageId? → MemoryEntry | editor; validar origen y alcance |
| PATCH `/memory/:id` | title/body, expectedVersion → MemoryEntry | editor; 409 si cambió |
| GET `/memory/:id/versions` | versiones autorizadas | lector del alcance |
| POST `/rooms/:id/attachments` | metadatos → URL temporal de carga | miembro; límites y tipo MIME |
| POST `/attachments/:id/complete` | → Attachment processing/ready/rejected | propietario; validar objeto real |
| GET `/attachments/:id/download` | → URL temporal | pertenencia actual; nunca bucket público |
| GET `/admin/workspaces/:id/deliveries` | filtros + cursor | admin; sin secretos ni contenido privado ajeno |

Las escrituras de mensajes, memoria y tareas deben pasar por la API para asegurar permisos e invariantes. Si se usa service role, la API no puede confiar en que RLS haga la autorización por ella. Usar transacciones y consultas con filtros explícitos por tenant y actor.

### Extensiones aceptadas por integración A — 31-oct-2026

La entrega REST incorpora estas extensiones aditivas. El frontend debe consumir estas formas exactas al sustituir fixtures por la API:

- Respuesta individual: DTO con `requestId` al mismo nivel. Listas: `{items, requestId}`; páginas: `{items, nextCursor, requestId}`.
- POST de mensaje: `{message, deliveries, requestId}` (`APIResult<SendMessageResult>`).
- `Task.version` es obligatorio para el control optimista. GET de proyecto añade `summary: {roomCount, taskCount, completedTaskCount, memoryCount}`, limitado al acceso del solicitante.
- POST `/rooms/:id/membership/accept`: `{participantId}` → Room. Solo el propio humano o dueño de esa IA puede aceptar.
- POST `/admin/workspaces/:id/members/:userId/revoke`: `{}` → `{revoked:true, requestId}`; controles de rol, sin auto-revocación ni revocación del owner.
- GET `/updates?scopeKind=room|project&scopeId=UUID&after=0&limit=50`: `{items,nextCursor,lastCursor,requestId}`. Elementos `AuthorizedUpdate`; guardar `lastCursor` incluso al terminar la página. Es consulta autorizada, no un canal Realtime activo.
- IDs de entidades REST: UUID. Cursores de listados: UUID; cursores de mensajes y cambios: secuencia decimal. El cliente debe conservarlos como cadenas opacas.

El transporte MCP y el repositorio de entregas todavía requieren un adaptador entre sus interfaces privadas; esta actualización no los declara conectados. Ver `docs/INTEGRATION_STATUS.md`.

## Herramientas MCP propuestas

| Tool | Función | Restricción |
|---|---|---|
| `get_my_profile` | Usuario de IAapp autorizado y conexiones identificables | ID estable del usuario en nuestro servicio, sin tokens |
| `claim_pairing` | Reclamar desafío de un uso | mismo propietario, desafío vigente; no declara identidad del chat como hecho |
| `confirm_pairing` | Cerrar prueba enviada por Events | capacidad de prueba de esa suscripción y generación |
| `read_room` | Mensajes autorizados paginados | capacidad de entrega o vinculación acotada + pertenencia actual |
| `read_memory` | Acuerdos del alcance autorizado | sin búsqueda transversal de memorias privadas |
| `respond_to_delivery` | Persistir una respuesta a una entrega | OAuth owner + replyCapability + vínculo + membresía + idempotencia |
| `save_agreement` | Guardar acuerdo explícitamente solicitado | editor en alcance; origen autorizado |

Las tools usan errores estables que la interfaz traduce. Los argumentos recibidos del modelo son datos no confiables. El actor efectivo se deriva del token validado y de la capacidad asociada a la entrega. Un OAuth válido del propietario no permite seleccionar cualquier IA ajena.

## MCP Events

Implementar `events/list`, `events/subscribe`, `events/unsubscribe` y anunciar capacidades en la versión soportada del protocolo. Evento de aplicación inicial: `message.created`. Filtro mínimo: buzón del participante (`participantId`). El servidor valida que el usuario tiene derecho a vincular ese buzón.

La suscripción guarda: propietario, participante, filtro canonizado, callback, secreto cifrado, generación, expiración, cursor y resultado de verificación. Secreto y callback nunca se devuelven al frontend.

El envelope sigue el contrato oficial. `data` tiene identificadores de entrega, sala y mensaje, resumen corto y capacidad de respuesta. Para mensajes largos, el chat usa `read_room`. La capacidad de respuesta no es un campo oficial de OpenAI: es un control propio de IAapp dentro de los datos del evento.

Capacidad: valor aleatorio de alta entropía guardado como hash; ligado a `delivery_id`, `connection_id`, generación, participante, sala y vencimiento. Se consume al persistir la respuesta dentro de una transacción. La idempotencia permite repetir la misma respuesta sin consumir un segundo permiso ni crear otra fila. Una capacidad usada con otro cuerpo o destino falla con conflicto.

Callbacks: seguir verificación y firmas Standard Webhooks documentadas por OpenAI. Validar destino HTTPS y direcciones públicas en conexión, impedir redirecciones, evitar SSRF, proteger de DNS rebinding. No hacer llamadas a URLs arbitrarias suministradas por usuarios. Verificación separada de contenido de aplicación.

Worker: concesión con expiración; backoff con jitter y máximo definido; reutilizar eventId con firma fresca; no reintentar 410 ni 413. Al 410 expirar canal y pedir reconexión. Al 413 guardar error recuperable y entregar referencias/resumen en un evento nuevo solo después de resolver el payload. Conservar auditoría de intentos sin cuerpos sensibles.

## Entidades de datos y claves

- `users`, `external_identities`: índice único `(issuer, client_id, subject)`; emails no prueban por sí solos vinculación de cuentas.
- `workspaces`, `workspace_members`, `invitations`: usuario/espacio único; invitación hash de un uso y vencimiento.
- `participants`: humano o IA; owner obligatorio para IA; handle único por espacio.
- `connections`, `pairing_challenges`, `subscriptions`: generaciones, verificaciones y secretos cifrados; tablas fuera de consultas públicas.
- `projects`, `project_members`, `rooms`, `room_members`: pertenencia y revocación explícitas.
- `messages`: secuencia monotónica por sala; unique `(room_id, sender_participant_id, idempotency_key)` con comparación del cuerpo de petición.
- `deliveries`, `delivery_attempts`: unique `(message_id, recipient_participant_id, generation)`; intentos separados de estado final.
- `memory_entries`, `memory_versions`: control optimista de versión, alcance y referencia de origen.
- `tasks`, `attachments`, `audit_events`: relaciones por proyecto/sala; auditoría sin tokens.

## Invariantes de permisos

1. Todas las consultas de datos compartidos verifican espacio y pertenencia al recurso concreto.
2. El dueño de una IA no obtiene acceso a las salas de otras personas por conocer sus IDs.
3. Añadir una IA a un grupo requiere que su propietario haya permitido esa participación. Una invitación de humano no autoriza automáticamente todos sus chats.
4. La eliminación de membresía impide nuevas lecturas y respuestas; cancelar entregas aún no aceptadas y rechazar respuestas posteriores sin autorización.
5. OAuth, permisos de sala, scopes y capacidades son comprobaciones acumulativas; ninguna reemplaza las otras.
6. Realtime usa canales privados. Una revocación requiere cerrar/reautorizar suscripciones y la API debe negar inmediatamente lecturas nuevas; probar el comportamiento real de canales ya abiertos.
7. Mensajes recibidos fuera de orden se presentan por secuencia del servidor. No ordenar solo por reloj del cliente.
8. La respuesta de una IA no emite nuevas entregas automáticas en v1. Una acción humana puede abrir un nuevo turno dirigido.

## Flags de producto

`signInWithChatGPT=false`, `voice=false`, `payments=false`, `claudeOriginalChats=false`, `grokOriginalChats=false`. `mcpEvents` se activa solo por cuenta con prueba real. `demoMode` se determina por despliegue independiente, no por un query param que permita saltar autenticación en producción.

## Criterios de integración frontend/backend

Fixtures y API real implementan la misma interfaz de repositorio. Las pantallas leen DTOs, no filas de BD directamente. Un cambio incompatible exige nueva versión de contrato y actualización conjunta. Cada error lleva código y requestId; ningún secreto entra en un toast. El prototipo no genera tokens reales ni ofrece registro activo.
