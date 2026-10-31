# MCP / Events — entrega D, 30-oct-2026

## Resultado y bloqueo de la prueba prioritaria

**No hay ida/vuelta real acreditada. No activar `mcpEvents` ni mostrar `ready`.**

Se leyeron README, BUILD_PLAN, API_CONTRACT, domain.ts y 03-MCP-EVENTS sobre
`main` en `167e49342c48b928af181a5948c2f6878f1599b1`. El árbol de ese commit
contiene prototipo, contratos y documentación; no contiene API, worker, proveedor
OAuth, migraciones ni configuración de un endpoint MCP. README confirma que aún
no existe backend de producción ni prueba Events en IAapp. No se recibió un
callback o una suscripción de ChatGPT durante esta ejecución. Las herramientas
disponibles en este chat no incluyen tools ni eventos de IAapp.

Esto impide iniciar la prueba mínima: falta un recurso MCP HTTPS configurado en un
plugin, un servidor de autorización registrado y una suscripción que el host cree
en la conversación elegida. **No demuestra que Events esté deshabilitado para
Luis ni para la segunda persona.** Esa disponibilidad requiere prueba por cuenta.
No se intentó reutilizar cookies de ChatGPT, API keys o callbacks de otros plugins.

Documentación oficial consultada el 30-oct-2026, America/Cancun:

- https://developers.openai.com/plugins/build/mcp-events
- https://developers.openai.com/plugins/build/auth

Events está documentado para Work web, escritorio con Cloud y dots. El servidor
implementa el camino Streamable HTTP sin sesión con `initialize` 2025-03-26,
respuesta JSON y sin streaming GET. No anuncia MCP 2.0 ni replay. Un callback
aceptado acredita recepción del host; el procesamiento del chat es asíncrono.

## Código implementado y límites

- `server.ts`: handler Node HTTP montable desde Express mediante un wrapper;
  metadata RFC 9728, autenticación por solicitud, descubrimiento, tools,
  subscribe/unsubscribe, IDs deterministas, TTL finito y verificación de callback.
- `security.ts`: validador de JWT RS256 con clave del issuer configurado,
  issuer/audience/exp/nbf/client/scopes y consulta de identidad/revocación actual;
  firmas Standard Webhooks, hash y cifrado autenticado AES-256-GCM por contexto.
- `webhook.ts`: HTTPS con lista explícita de hosts, bloqueo de IPs no públicas,
  DNS validado y dirección fijada al socket con TLS del hostname original;
  no sigue redirects. Límite de cuerpo 256 KiB y respuesta 16 KiB.
- `ports.ts`: interfaz propuesta **privada del módulo**, no contrato compartido.
- `apps/worker/worker.ts`: una iteración de worker con puerto de cola persistente,
  lease, reautorización, backoff con jitter, ocho intentos, eventId/cuerpo estables,
  firma fresca, rotación y tratamiento terminal de 410/413.

**Pendiente, no implementado por este módulo:** adaptador Postgres, transacciones
de claim/confirm/respuesta, mapeo de identidad externa, persistencia y consultas de
permisos. También faltan el bootstrap HTTP, loop supervisado del worker, JWKS del
issuer, límites de tasa distribuidos y despliegue. No se entrega un servidor
OAuth propio: se integra un authorization server del backend. Su discovery,
PKCE S256, cliente registrado y redirect exacto de ChatGPT deben validarse en vivo.
El validador actual exige `client_id`; si el proveedor no lo emite, backend debe
resolverlo de manera verificada mediante introspección, nunca tomarlo del modelo.

No existe fallback en memoria. Los dobles de pruebas no acreditan durabilidad ni
atomicidad real. No se anuncian read_room/read_memory/save_agreement hasta que
backend implemente sus permisos. El payload lleva resumen breve y la capacidad de
retorno; no incluir instrucciones del modelo dentro del evento.

## Relevo a backend C e integración A

No se modificaron frontend, raíz, dependencias, contratos ni esquema compartido.
Esta interfaz queda propuesta para integración, **no se afirma acuerdo con otro
chat**. Backend puede adaptar los puertos a sus repositorios sin cambiar los DTOs.

1. Proveer un `McpRepository` y `WorkerRepository` transaccionales. No montar el
   handler con stubs. Conservar claves de unicidad de API_CONTRACT.
2. `createPairing`: REST deriva owner de sesión, verifica propiedad, bloquea fila,
   avanza generación, invalida capacidades viejas y guarda hash del código de
   256 bits, vencimiento de diez minutos y contador de intentos. Nunca loguear código.
3. `claimPairing`: consumo atómico del hash por el mismo propietario OAuth,
   vigente y no utilizado; rate limit por actor. El modelo no aporta owner/chat ID.
4. `saveSubscription`: comprobar binding actual, identidad/grant, generación y
   estado bajo lock. Una conexión admite una suscripción activa. Otro callback
   no reemplaza silenciosamente una conversación; requiere nuevo emparejamiento.
   Refresh conserva estado y no genera probes repetidos. Guardar secreto cifrado;
   callback y secreto solo accesibles a API/worker. Almacenar la clave anterior
   durante 60 s para rotación; limpiar después.
5. Primera suscripción verificada: guardar `awaiting_probe` y encolar probe en la
   misma transacción. Usar `message.created` y el DTO compartido; `summary` describe
   la prueba. `delivery.kind=pairing_probe` es privado; nunca campo nuevo del DTO.
6. Generar capacidad aleatoria por entrega; guardar su hash junto a owner,
   identidad OAuth, subscriptionId, connectionId, generación, participante, sala,
   tipo y vencimiento. El envelope estable conserva la capacidad cifrada, con
   `seal(JSON.stringify(event), key, delivery.id)`; no se guarda texto plano.
7. `completeDelivery`: bloquear entrega/capacidad/conexión; verificar todos esos
   vínculos y permiso actual del owner y participante en sala/espacio; usar
   comparación constante de hash. Una capacidad de probe solo admite
   confirm_pairing, una normal solo respond_to_delivery. No confiar en IDs del
   modelo; remitente y `in_reply_to` salen de la entrega. Consumir capacidad,
   insertar mensaje y cerrar entrega atómicamente. Solo confirmación real deja
   `ready`. No crear outbox desde respuestas IA.
8. Unicidad de idempotencia incluye entrega + identidad + key y hash del cuerpo.
   Repetición autorizada exacta devuelve resultado previo; cuerpo o destino
   alterado da conflicto. Revalidar revocación y membresía incluso al repetir.
9. `leaseNext`: SKIP LOCKED, concesión 60 s, recuperar concesiones vencidas y
   attempts++. No volver a encolar `received_by_host` por ausencia de respuesta.
   Al terminar, CAS del lease y preservar `reply_received` si el tool llegó antes
   del fin del POST. Guardar intentos sin cuerpos, capacidades, tokens ni URLs.
10. `authorizeLease`: verificar vigencia, generación, permisos, grant y suscripción
    actuales; devolver secretos actuales tras refresh. Pausar cancela leases;
    revocar/expirar/unsubscribe invalida capacidades y cancela pendientes. Un POST
    ya iniciado puede llegar después de pausa: rechazar su respuesta si ya no está
    autorizada. Reconexion requiere nueva generación y nuevo probe.
11. `410`: expirar suscripción/conexión y capacidades atómicamente. `413`: no retry;
    corregir resumen/referencias antes de crear evento nuevo. Las entregas
    aceptadas sin respuesta permanecen diferenciadas y vencen por un barrido DB;
    nunca reenviarlas indefinidamente ni transformarlas en respuestas.

Configuración requerida, sin valores secretos en este archivo:

- URL HTTPS canónica de recurso MCP y metadata; issuer exacto; cliente(s) OAuth
  aprobado(s); JWKS configurado y cacheado con rotación; scopes connect/respond.
- Redirect URI exacto de la pantalla de administración MCP de ChatGPT. No
  adivinarlo. Registrar metadata y `resource`/audience en authorization server.
- Clave de cifrado de 32 bytes desde secret manager y plan de rotación.
- Lista de hosts de callback aprobados a partir de la configuración oficial del
  host. No usar wildcard ni derivarla de cada petición de suscripción.
- Postgres y loop de worker supervisado, sin proceso dentro de Vercel efímero.
- Límites de tasa/cuerpo/timeouts en proxy y backend; política de borrado y logs.

## Cómo reproducir la prueba real cuando esas dependencias existan

1. Desplegar API/worker y migraciones acordadas, configurar OAuth y plugin privado.
   Reescanear tools/eventos. Comprobar 401 sin token, metadata y flujo PKCE real.
2. Luis inicia sesión en IAapp, crea perfil y genera código de un uso. En **su
   conversación original** Work web o escritorio Cloud, autoriza IAapp vía OAuth
   y pide: «Reclama el código [código privado]. Suscríbete a message.created del
   participantId devuelto. Cuando recibas la prueba, usa confirm_pairing con los
   datos y capacidad de esa entrega; para mensajes normales usa
   respond_to_delivery. No envíes turnos a otras IAs automáticamente».
3. Registrar recepción real de events/subscribe, ID redactado, generación y
   timestamp; desafío firmado validado; suscripción persistida y probe en outbox.
4. Registrar POST de probe y estado received_by_host. **No cerrar aceptación aquí.**
   Esperar tool confirm_pairing autenticada; comprobar mensaje persistido y
   cambio a ready visible desde API/PWA. Guardar evidencia sin capacidad/token.
5. Enviar mensaje humano dirigido desde IAapp. Comprobar evento en el chat
   original, respond_to_delivery autorizada, una fila con in_reply_to y respuesta
   visible en PWA. Repetir con la PWA cerrada. Sin PWA integrada, esa parte queda
   pendiente aunque DB/tools funcionen.
6. Repetir con segunda persona, otra cuenta ChatGPT y autorización separada. Cada
   cual empareja su conversación original. Crear sala compartida con consentimiento
   y dirigir a una IA por turno. Comprobar aislamiento de propietarios y que solo
   recibe la destinataria elegida.
7. Probar duplicados, callback inválido, secret rotation, respuesta fuera de
   generación, capacidad ajena/expirada, pausa, revocación, expiración, reinicio
   DB/worker y desconexión OAuth. Verificar ausencia de nuevos turnos IA→IA.

## Evidencia local reproducible

Desde raíz del repositorio, con Node 24:

```sh
node --experimental-strip-types --test apps/api/src/mcp/mcp.test.ts apps/worker/worker.test.ts
```

Nueve pruebas pasan: validación JWT local y rechazos, identidad canónica de
suscripción, firma exacta/rotación, cifrado por contexto, desafío con eco, rechazo
SSRF, endpoint HTTP autenticado, clasificación de entregas y reintento estable con
reautorización. Son pruebas locales con dobles de repositorio y callback: **cero
cuentas de ChatGPT probadas**, cero suscripciones reales y cero respuestas reales.
Quedan pendientes pruebas de persistencia/reinicio, concurrencia de consumo y
revocación en BD, DNS pinning/redirecciones contra servidor HTTPS controlado,
registro OAuth/PKCE real y recorrido de dos cuentas con evidencia PWA.
El entorno no dispone del compilador TypeScript: Node ejecutó los módulos con
eliminación de tipos; no se acredita un chequeo estático `tsc` ni build del monorepo.
