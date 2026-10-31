# IAapp — relevo C: datos, REST y permisos

Repositorio: `turbillon50/IA`. Base leída: `167e49342c48b928af181a5948c2f6878f1599b1`.
Responsable de integración: A. Responsable de OAuth, emparejamiento verificado, Events y worker: D.
Solo se modificaron `packages/db`, `apps/api/src/rest` y `apps/api/src/auth`. No se cambiaron contratos, frontend, documentación compartida ni dependencias raíz.

## Resultado comprobable

- Dos migraciones transaccionales con journal, checksums y bloqueo de migrador; 24 tablas en esquema privado `iaapp`. Usuarios internos UUID; identidad externa `(issuer, client_id, subject)` como texto, sin unión automática por correo.
- Invitaciones aleatorias de 256 bits, solo hash en BD, correo verificado coincidente, vencimiento, uso único y autoridad vigente del emisor. Nunca se envían correos desde este código.
- Espacio + proyecto + sala se autorizan de forma acumulativa. Los administradores no leen salas privadas por su rol. Aceptación de sala independiente por humano o propietario de IA. Un perfil de IA ajeno no acepta participación por estar invitado su dueño al espacio.
- Remitente derivado del actor interno. REST rechaza propiedades inesperadas, incluidos `sender_id` y `senderParticipantId`. Escrituras de mensajes, secuencia, entregas, outbox y notificaciones en una misma transacción.
- Idempotencia actor/sala/clave con hash canónico del contenido, adjuntos y destinatarios. Cambio de contenido: 409. Cursores de mensajes `after` ascendentes o `before` descendentes; no se pueden combinar.
- Memoria con autor, mensaje origen validado, alcance, categorías y snapshots por versión. Control optimista al editar memoria y tareas.
- RLS por defecto deniega todas las tablas a clientes; no hay políticas permisivas ni publicación de tablas en Realtime. El servidor realiza ACL explícita, incluso cuando su rol de BD puede omitir RLS.
- Feed de cambios mediante consulta autorizada por alcance. Solo IDs, tipo y versión; contador bloqueado por sala/proyecto evita perder cambios por commits fuera de orden. La fuente de verdad sigue siendo la API.
- Archivos: validación de metadatos, propiedad, límites, MIME detectado, escaneo y objeto inmutable antes de `ready`. Cada solicitud de descarga revisa el permiso actual. Sin proveedor privado inyectado devuelve `CONNECTION_UNAVAILABLE`; no genera URLs ficticias.

## Ejecutar sin servicios duplicados

Node 24. No se creó ni contrató infraestructura. Se revisaron el repositorio y los inventarios conectados: el proyecto Vercel observado es `iaapp-design`; no se identificó un backend IAapp en Railway. No se dispuso de una cuenta Supabase o Clerk configurada para verificarla. Esto no prueba que no exista en otra cuenta: integración debe confirmar recursos y secretos existentes antes de provisionar.

```sh
npm ci --prefix packages/db
npm ci --prefix apps/api/src/auth
npm ci --prefix apps/api/src/rest
npm test --prefix packages/db
npm run check --prefix packages/db
npm run check --prefix apps/api/src/rest
```

Instalaciones separadas para respetar propiedad de archivos. A puede consolidarlas al workspace raíz; los lockfiles fijan versiones concretas. Auditoría de dependencias de producción: 0 vulnerabilidades reportadas en las tres instalaciones durante esta entrega; no es una auditoría de seguridad completa.

Para aplicar al Postgres **existente**: configurar `IAAPP_DATABASE_URL` fuera de git y ejecutar `npm run migrate --prefix packages/db`. El proceso HTTP no aplica migraciones automáticamente. El seed se exporta únicamente para pruebas sintéticas; no ejecutar sobre producción.

Para iniciar HTTP: `npm start --prefix apps/api/src/rest`. Base `/api/v1`.

| Variable | Uso |
| --- | --- |
| `IAAPP_DATABASE_URL` | Postgres existente y credencial solo del servidor; TLS verificado según proveedor. Nunca PWA. |
| `CLERK_SECRET_KEY` | Clave backend de la aplicación Clerk existente. |
| `CLERK_ISSUER` | Emisor exacto esperado para sesiones humanas. |
| `CLERK_CLIENT_ID` | Namespace estable de la aplicación humana en nuestra tabla de identidades; configuración de servidor, no `sid` de una sesión ni valor del cliente. |
| `IAAPP_ALLOWED_ORIGINS` | Orígenes PWA explícitos separados por coma; también `authorizedParties` de Clerk. |
| `CLERK_AUDIENCE` | Opcional, si la aplicación emite una audiencia configurada. |
| `PORT` | Puerto HTTP, 3001 por defecto. |

`clerkAdapter` verifica firma/expiración con SDK oficial, emisor exacto, `azp`, `sid`, sesión activa en backend y usuario no bloqueado. Obtiene emails verificados de Clerk, nunca de un payload. Falta probar con cuenta real. Documentación consultada: https://clerk.com/docs/reference/backend/verify-token y https://clerk.com/docs/reference/backend/authenticate-request.

El rol de migración debe poder crear el esquema y sus objetos. El runtime necesita acceso servidor a `iaapp` y privilegios adecuados para operar pese a RLS (propietario o rol backend explícito); usar una conexión Postgres del backend, no una clave Supabase pública. No exponer `iaapp` a PostgREST, no otorgar credenciales de este rol a clientes y no desactivar validación TLS. Integración deberá separar los roles de migración/runtime y revisar grants en el entorno elegido. No hay conexión asumida a `auth.users`.

## Integración REST: decisiones que A debe incorporar al contrato

Todas las rutas del contrato se montan en `createRestRouter` / `createRestApp`, con `requestId`, errores estables y `Cache-Control: no-store`. Mensajes devuelven `{message, deliveries, requestId}`. Listas sin paginación de entregas y versiones devuelven `{items, requestId}`. Páginas conservan `{items, nextCursor, requestId}`. DTOs individuales se devuelven junto con `requestId`. La creación de invitación devuelve token solo al administrador creador para su entrega por canal autorizado.

El contrato v1 no especifica envoltura exacta de todas las respuestas, aceptación de una sala, revocación administrativa ni actualización incremental. Se proponen estas extensiones **en esta PR**, sin editar unilateralmente `API_CONTRACT.md` o `domain.ts`:

| Ruta añadida | Entrada / salida |
| --- | --- |
| POST `/rooms/:id/membership/accept` | `{participantId}`; actor debe ser ese humano o dueño de esa IA; acepta invitación pendiente y devuelve Room. |
| POST `/admin/workspaces/:id/members/:userId/revoke` | `{}`; owner/admin según rol objetivo; devuelve `{revoked:true}`. No revoca al owner ni a sí mismo. |
| GET `/updates?scopeKind=room&scopeId=...&after=0&limit=50` | También `project`; devuelve `{items,nextCursor,lastCursor,requestId}`. Guardar `lastCursor` incluso al agotar la página. |

`Task` no declara `version`, aunque PATCH lo exige. La respuesta de tareas incluye `version` como extensión aditiva para que el cliente pueda editar correctamente. A debe formalizarla. GET de proyecto devuelve Project y un `summary` con `roomCount` autorizado, `taskCount`, `completedTaskCount` y `memoryCount` de alcance proyecto; A debe formalizar esa forma del resumen. No hay filtros de búsqueda textual, listado de invitaciones pendientes ni administración de miembros de proyecto en el contrato v1; no se implementaron buscadores transversales que puedan filtrar recursos privados. La incorporación inicial de owners/proyectos compartidos requiere una operación administrativa de integración, no registro público automático.

## Relevo a D — persistencia MCP, sin transporte

`Database.transaction` y `Query` son las interfaces de unidad de trabajo; `postgres(url)` aporta el adaptador pg. D no debe exponer SQL como herramienta a modelos.

`DeliveryRepository` en `src/mcp-persistence.ts` ofrece:

1. `claimOutbox`: `FOR UPDATE SKIP LOCKED`, lease de 30 s y token de concesión. `eventId` se conserva en reintentos.
2. `issueReplyCapability`: revalida dueño, espacio/proyecto, participación IA y remitente actual, conexión/generación y suscripción verificada no expirada. Emite capacidad aleatoria de 256 bits, guarda solo hash; TTL 10 min. La capacidad en claro solo va al host autorizado, nunca REST, PWA o logs.
3. `recordHostResult`: auditoría de código HTTP, 2xx = `received_by_host`, 410 expira generación, 413 sin reintento, máximo 8 intentos emitidos. D aporta backoff con jitter mediante `retryAt` y resuelve errores de transporte como resultados HTTP sintéticos apropiados sin guardar cuerpos sensibles.
4. `respond`: recibe `VerifiedMcpActor` **del verificador OAuth real**, scope `deliveries:respond`, capacidad y clave. Verifica todo otra vez, consume capacidad y persiste una sola respuesta transaccional con `inReplyTo`; no genera entregas nuevas. Un duplicado exacto devuelve la respuesta; cuerpo o clave diferentes entran en conflicto.
5. `readRoom`, `readMemory`, `saveAgreement`: scopes `rooms:read`, `memory:read`, `memory:write`; capacidad delimita la sala. No aceptan un `roomId`, autor u origen arbitrario del modelo. `saveAgreement` fija autor IA y origen en el mensaje humano entregado; la capa tool debe comprobar solicitud explícita humana. Memoria MCP de proyecto fuera de la sala queda pendiente de definición de scopes con A/D.

`VerifiedMcpActor` es una interfaz interna de confianza, no un token ni una comprobación criptográfica por sí sola. No construirla desde argumentos del modelo o desde una sesión PWA. D debe validar OAuth por operación y resolver/linkear explícitamente su identidad al usuario interno; no unir usuarios por correo. `IdentityResolver` humano no sirve como validador OAuth.

D controla emparejamiento, subscriptions, cifrado/rotación de secretos, OAuth metadata/PKCE, firmas, callbacks/SSRF y bucle worker. Las tablas están preparadas. `Connections.pairing` crea desafío y nueva generación; `Connections.change` invalida suscripciones/capacidades/entregas. Ninguna ruta establece una conexión como ready; D debe hacerlo solo tras confirmación real y crear subscription verificada con generación, propietario y expiración correctos.

Antes de enviar HTTP, D debe exigir lease vigente y `issueReplyCapability` correcto. Si la concesión caduca durante HTTP, el resultado tardío no se acepta como dueño del lease: reconciliar/reintentar con `eventId` estable. Si se rechaza ACL, terminar ese trabajo sin intentar transporte. Cancelados quedan fuera del claim; un proceso de retención puede limpiar outbox finalizado/cancelado posteriormente. No borrar idempotencia o capacidades consumidas antes de definir retención.

## Archivos y actualizaciones: límites reales

`Files` exige `PrivateStorage`: firma de carga acotada sin overwrite, inspección del objeto real (bytes/MIME detectado/escaneo/inmutabilidad), firma privada de descarga de 60 s. El objeto listo debe quedar inmutable incluso si se reutiliza una URL de carga; sellar/copiar a objeto privado protegido si Supabase no puede garantizarlo directamente. Implementación Supabase, bucket, escáner y configuración de límites **no están conectados**. Las pruebas usan un adaptador sintético explícito. URLs previamente firmadas pueden durar hasta su TTL después de una revocación; si se exige corte instantáneo de una descarga ya autorizada, usar proxy de descarga que revalide cada acceso.

`readUpdates` es consulta corta con ACL en cada petición. No hay WebSocket/Realtime en producción y no se acredita revocación de canales Supabase abiertos. Mantener Realtime deshabilitado hasta que E pruebe canales privados y revocación real. El feed solo cubre cambios desde la migración 002; sincronización inicial debe obtener el estado completo y luego continuar por cursor.

## Evidencia y puerta pendiente

`EVIDENCE.txt` contiene la ejecución completa de las pruebas sintéticas y comprobaciones TypeScript. Se comprueban aislamiento de dos propietarios y tercero sin acceso; aceptación explícita; archivo ajeno; suplantación HTTP; replay/conflicto; secuencias concurrentes; rollback forzado del outbox; reconstrucción desde disco; memoria versionada y origen; invitaciones de un uso/expiradas; RLS; revocación y feed reautorizado; generación/capacidad; 2xx sin fingir respuesta; ausencia de bucles; rol lector y suscripción vencida.

PGlite ejecuta Postgres real compilado a WASM, con transacciones, constraints y RLS; no reemplaza la prueba con múltiples conexiones al Supabase real. Las invocaciones concurrentes de esta suite se serializan en su conexión embebida; A/E deben repetir contención, deadlocks/reintentos y caída de procesos con pg/Supabase y workers separados. No se conectaron dos cuentas humanas reales, ni se probó OAuth/Events, backups/restore de Supabase o permisos de un bucket real. No publicar todavía como piloto de producción validado.

Integración siguiente: A revisa extensiones del contrato, consolida dependencias y grants; D implementa OAuth/pairing/worker sobre estas interfaces; E ejecuta la suite contra servicios reales, verifica Storage y canales, y ensaya restauración antes de usar datos relevantes. El acceso oficial con ChatGPT permanece sin implementar y deshabilitado; no se usan cookies ni sesiones de ChatGPT.
