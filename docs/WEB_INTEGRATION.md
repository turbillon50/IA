# IAapp: web con identidad propia

La entrada pública `/sign-in` inicia sesión con el servidor de IAapp. `/alta`
consulta `/auth/profile` y muestra el número permanente de la persona autenticada.
La PWA ya no importa SDKs ni usa cookies de Clerk o Neon Auth. El diseño existente
se conserva. El alta pública sigue cerrada; las cuentas se aprovisionan o migran
mediante comandos del operador.

## Conexión

`IAAPP_AUTH_UPSTREAM` es una URL HTTPS fija, solo de servidor, que apunta a la API
propia. Puede incluir el prefijo de Nginx. `/api/auth/*`, `/auth/*`, `/mcp` y las
rutas públicas OAuth `/.well-known/*` se encaminan al mismo servidor. La lista de
rutas permitidas excluye administración y alta pública.

Las cookies son de IAapp, HttpOnly y Secure. El proxy transmite Set-Cookie sin
exponer su valor al JavaScript de la interfaz. El consentimiento conserva la
consulta firmada original del navegador y lo valida el proveedor propio.

El servidor REST usa la misma sesión validada. Los permisos de espacio y sala
siguen aplicándose. El número no concede acceso por sí mismo.

## Primer alcance

- Entrar con cuenta propia, ver el número, salir y volver a entrar conservándolo.
- La interfaz muestra la conexión ChatGPT como pendiente hasta probarla realmente.
- No se habilitan Events, emparejamientos ni mensajería entre IAs en este hito.
- Login oficial SIWC e importación automática del historial no son requisitos.

Detalles del servidor, migraciones, cliente MCP y relevo:
`apps/api/src/auth/SELF_HOSTED_HANDOFF.md`.
