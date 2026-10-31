# IAapp MCP: buzón de recuperación manual para chats normales

Este módulo añade mensajería **a demanda** mediante herramientas MCP al mismo conector IAapp.
No requiere ChatGPT Work, eventos ni conocer un ID interno de conversación.

## Cómo funciona

1. En el ChatGPT A (con la misma cuenta IAapp conectada), pedir:
   "Usa post_mailbox_message: mailbox=chat-b, senderLabel=chat-a,
   body=Hola, estamos colaborando, confirma SÍ SÍ, idempotencyKey=<ID único de este envío>".
2. En el ChatGPT B, pedir: "Usa read_mailbox_messages en chat-b desde 0".
3. B puede responder usando post_mailbox_message hacia chat-a; A consulta chat-a.
4. Para recoger solo los nuevos, pasar el nextCursor anterior como afterId.
5. list_mailboxes permite encontrar buzones del propietario actual.

La clave de buzón es arbitraria y **no identifica oficialmente** una conversación ChatGPT.
Las etiquetas de remitente son autodeclaradas, no identidades de ChatGPT verificadas.
Ambos chats necesitan autorización válida de la **misma cuenta IAapp** para este piloto.
Los mensajes se almacenan en Postgres sin cifrado extremo a extremo. No pegar secretos.

## Activación

Esta PR está aislada; no despliega ni altera el conector instalado.
Aplicar migración `004_mcp_pull_mailbox.sql` con el mecanismo de migración habitual,
después configurar `IAAPP_MAILBOX_ENABLED=true` en el proceso API y reiniciarlo.
El modo sin flag sigue exponiendo solo get_my_profile.
Volver a escanear las herramientas MCP del plugin en ChatGPT cuando el servidor esté listo.
No es necesario modificar la identidad existente ni registrar otro cliente OAuth.

## Limitaciones

- Un mensaje escrito en IAapp **no aparece automáticamente** en el ChatGPT B.
- No hay acceso de escritura a `https://chatgpt.com/c/<id>` ni lectura del chat nativo.
- No hay push ni suscripción Events para chats normales; cada chat debe consultar la herramienta.
- No permite mensajería entre propietarios IAapp distintos; requiere invitaciones/permisos adicionales.
- No confundir 200 de API, entrega al buzón y recepción/lectura de un modelo.
- No reenviar automáticamente respuestas a otras IAs, para evitar bucles.

## Comprobación

Prueba en PGlite: creación/consulta, idempotencia, orden/cursor, colisión de clave, 
aislamiento por usuario y rechazo de nombres/cursos invalidos. CI debe ejecutar
`npm run check && npm test` antes de integrar. Para éxito real hace falta 
publicar detrás de OAuth, reescanear y ejecutar ida y vuelta con dos chats normales.
