# IAapp Chat — piloto autónomo y funcional

Esta carpeta es una **aplicación real**, no un prototipo de mensajes simulados: dos usuarios distintos pueden iniciar sesión, crear una conversación directa o un grupo, enviar y recibir mensajes en vivo por Server-Sent Events, consultar historial persistido y buscar mensajes autorizados. El navegador móvil tiene su propia interfaz y mantiene el compositor en pantalla.

**Aislada de IAapp:** no sustituye ni modifica el backend, OAuth, MCP ni el trabajo en marcha de Gemini. Su esquema es propio. Se integra únicamente después de aprobar y probar un adaptador explícito. Nada aquí usa cookies de ChatGPT ni suplanta una cuenta original.

## Requisitos

Node.js **24.22.1+** (la base de datos usa el módulo \`node:sqlite\` incorporado). Cero paquetes npm y cero inferencias de IA/GPU.

## Iniciar en localhost

\`\`\`bash
cd experiments/astro-chat
export CHAT_DB="$PWD/data/chat.sqlite"
export CHAT_NEW_USERNAME="alice"
export CHAT_NEW_DISPLAY_NAME="Alicia"
read -rsp "Clave de Alicia (mínimo 10 caracteres): " CHAT_NEW_PASSWORD; echo
export CHAT_NEW_PASSWORD
node provision.mjs
unset CHAT_NEW_PASSWORD

export CHAT_NEW_USERNAME="bob"
export CHAT_NEW_DISPLAY_NAME="Bob"
read -rsp "Clave de Bob (mínimo 10 caracteres): " CHAT_NEW_PASSWORD; echo
export CHAT_NEW_PASSWORD
node provision.mjs
unset CHAT_NEW_PASSWORD

CHAT_HOST=127.0.0.1 CHAT_PORT=4051 node server.mjs
\`\`\`

Abrir http://127.0.0.1:4051 desde un navegador en ese servidor, o mediante túnel SSH seguro. Para acceso remoto debe colocarse detrás de un proxy **HTTPS**, con \`CHAT_PUBLIC_HTTPS=true\` y un mecanismo de acceso restringido. **No abrir el puerto HTTP públicamente.**

## Pruebas ejecutadas en Hetzner (31-oct-2026)

\`\`\`bash
node --test tests/chat.test.mjs
PLAYWRIGHT_CORE=/opt/rea-runtime/cli/node_modules/playwright-core/index.mjs node tests/browser.e2e.mjs
\`\`\`

- API: autenticación, autorización por sala, prevención de duplicados, mensajes bidireccionales, entrega SSE, búsqueda con permisos, grupos y persistencia tras reinicio — **aprobado**.
- Playwright en Chrome (390×844 y 1440×900): dos cuentas inician sesión, crean conversación, intercambian mensajes sin recargar, conservan historial al recargar, sin excepciones de página y sin scroll horizontal en móvil — **aprobado**.
- La composición del teclado virtual físico en iPhone real **no está probada**; el navegador headless no lo emula exactamente.
- Archivo \`data/\` debe permanecer fuera de Git y de copias públicas. No se desplegó sobre el dominio de IAapp ni se cambió \`main\`.

## Lo que NO ofrece todavía

No tiene envío de archivos, llamadas, mensajes de voz, notificaciones push, cifrado extremo a extremo, controles avanzados de administración, recuperación de contraseña, alta de cuentas desde la web, ni conexión con IAapp OAuth/ChatGPT. No afirmar estas capacidades.

El objetivo de este piloto es validar el **núcleo confiable del mensajero** antes de incorporar extras. Sus controles deben pasar pruebas funcionales y QA visual antes de cualquier merge o despliegue comercial. Cifrado HTTPS protege el transporte, pero **la base de datos del servidor contiene mensajes en texto legible**; no usar información sensible real hasta completar revisión de privacidad, respaldos y controles de acceso.

## Archivos

- \`server.mjs\`: servidor HTTP, autenticación, SQLite, salas, mensajes, búsqueda, SSE y pertenencia.
- \`provision.mjs\`: altas explícitas por operador, sin registro público.
- \`public/\`: interfaz responsive independiente.
- \`tests/chat.test.mjs\`: integración real entre usuarios.
- \`tests/browser.e2e.mjs\`: prueba de navegador real, opcional si Playwright está instalado.

No hay costos variables de modelos de IA. El servidor existente sí consume CPU, RAM, almacenamiento y red, que deben medirse antes de producción.
