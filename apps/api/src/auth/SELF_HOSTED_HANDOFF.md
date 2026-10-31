# IAapp: identidad propia y primer vínculo MCP

Alcance único: cuentas operadas por IAapp, número permanente y `get_my_profile`
autorizado desde un cliente MCP. Implementación sobre main `46c1982` usando Better
Auth y OAuth Provider MIT, versión fijada 1.7.14, alojables en nuestro servidor.
No depende de Clerk, Neon Auth, ChatGPT Sites ni Sign in with ChatGPT.

## Qué incluye

- El arranque API existente monta autenticación propia y reutiliza el transporte
  MCP existente en modo `profile`: anuncia exclusivamente `get_my_profile`.
- Login, consentimiento firmado y pantalla de cuenta en `/auth/sign-in`,
  `/auth/consent` y `/auth/account`. Cookies HttpOnly, sesiones verificadas en BD,
  CSP con nonce y consultas de perfil derivadas del actor autenticado.
- OAuth authorization-code + PKCE S256, JWT RS256, audiencia MCP exacta,
  cliente preinscrito y comprobación de sesión/concesión vigentes por petición.
  `azp` es la identificación del cliente emitida por este proveedor. Otros
  proveedores existentes conservan `client_id` por defecto.
- Migración 003: esquema privado `iaapp_auth` y `users.line_number`, identidad
  numérica única desde 100000. El mismo usuario conserva el número entre sesiones.
  Es un identificador de IAapp, no un número de telefonía ni una identidad OpenAI.
- Registro y administración de clientes cerrados en HTTP. El alta inicial es un
  comando local explícito, no una puerta pública ni un bypass de producción.
- El adaptador humano sigue usando IdentityResolver; REST ahora le transmite las
  cookies además de Authorization. No se fusionan cuentas por correo.

## Configuración para ejecutar en el servidor existente

Configurar por el administrador de secretos, sin pegar valores en chats ni git:

- `IAAPP_DATABASE_URL`: Postgres existente. Rol servidor propietario de los
  esquemas privados; no usar esta credencial desde el navegador.
- `IAAPP_PUBLIC_ORIGIN`: origen HTTPS público exacto, sin ruta ni parámetros.
- `IAAPP_AUTH_SECRET`: secreto aleatorio de al menos 32 caracteres; conservarlo
  entre reinicios (protege las claves de firma almacenadas).
- `IAAPP_OAUTH_CLIENT_IDS`: identificador o identificadores previamente registrados.
- `PORT`: puerto interno, por defecto 3001.

Preparación explícita, después de respaldo y revisión del entorno:

1. `npm ci --ignore-scripts` y `npm run bootstrap`.
2. `npm run migrate` aplica las tres migraciones con checksum y transacción.
3. Para el alta inicial, configurar temporalmente `IAAPP_PROVISION_EMAIL`,
   `IAAPP_PROVISION_NAME`, `IAAPP_PROVISION_PASSWORD` e `IAAPP_OAUTH_REDIRECT_URI`.
   La URI debe copiarse de la gestión real de la conexión MCP de ChatGPT, no
   inventarse. Ejecutar `npm run provision --prefix apps/api/src/auth`.
   El comando imprime solamente userId y clientId, cierra su sesión temporal y
   termina. Es alta inicial: no sobrescribe usuarios existentes.
4. Conservar el clientId como `IAAPP_OAUTH_CLIENT_IDS` y retirar las variables
   temporales de aprovisionamiento. `npm run start:api` inicia el servicio.

Nginx debe dirigir `/api/auth/*`, `/auth/*`, `/api/v1/*`, `/mcp`, `/healthz` y las
rutas `/.well-known/*` a esta misma API, conservando host/protocolo y cookies.
Si pasa por MetaMCP, comprobar que no sustituya tokens de usuario por uno global.
La web existente aún tiene pantallas Neon: esta entrega ofrece acceso propio en
`/auth/sign-in`; cambiar la navegación de la PWA requiere coordinación con frontend.

Descubrimiento público:

- Recurso: `/.well-known/oauth-protected-resource/mcp`.
- Emisor: `<origen>/api/auth`.
- OAuth: `/.well-known/oauth-authorization-server/api/auth`.
- OIDC: `/.well-known/openid-configuration/api/auth`.
- Herramienta: `/mcp`, scope `iaapp:connect`.

El cliente se configura como OAuth público predefinido (`none`), con clientId y
PKCE. No hay registro dinámico abierto ni se necesita un secreto de cliente.

## Evidencia y límite

`npm run check` y `npm test` incluyen la nueva prueba de extremo a extremo local.
Usa Postgres embebido PGlite, migraciones reales y el proveedor OAuth real de la
aplicación; el cliente OAuth de la prueba es sintético y no representa ChatGPT.
No se emplean tokens de OpenAI, claves API ni cookies de ChatGPT.

La prueba crea cuenta y cliente; obtiene consentimiento, canjea código mediante
PKCE, consulta el perfil por HTTP y compara número/usuario con la sesión humana.
Prueba token alterado, falta de token, código repetido, consulta con sender_id,
sesión cerrada, identidad diferente, consulta tras recrear servicio, metadatos,
página login y consentimiento manipulado. Registro HTTP permanece cerrado.

Pendiente para acreditar el recorrido real: desplegar esta API en el dominio
elegido, aplicar migración, aprovisionar la cuenta y cliente con retorno exacto,
conectar el plugin y ejecutar `get_my_profile` desde ChatGPT. Esta entrega no
declara ese vínculo probado ni modifica infraestructura remota.

Fuentes revisadas:
- https://developers.openai.com/plugins/build/auth
- https://better-auth.com/docs/plugins/oauth-provider
- https://better-auth.com/docs/plugins/jwt

Para volver al arranque anterior, restaurar el commit de API anterior. No borrar
tablas de autenticación ni números al revertir código; conservar respaldo y
IAAPP_AUTH_SECRET. La migración es aditiva y no reasigna identidades históricas.
