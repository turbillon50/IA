# IA.app CHAT — aplicación principal en el dominio comprado

Fecha: 2026-10-31. Dominio canónico de producto: **https://iaapp.live/**.

## Estructura en producción
- **Origen web único:** proyecto Vercel `iaapp-web`, repositorio `turbillon50/IA`.
- **Portada del sitio:** el cliente Flutter real de `turbillon50/iaapp-chat`, distribuido como archivos estáticos dentro de Next. No iframe, redirección, clon visual ni proxy de la página principal.
- **Ruta:** `/` reescribe internamente a `/chat-client/index.html`. Los archivos del mensajero viven bajo `/chat-client/`, preservando las otras rutas Next.
- **Identidad propia:** `/api/auth/*`, `/auth/*`, `/alta` y `/.well-known/*` siguen bajo la aplicación Next original, conectada a Better Auth.
- **Conector ChatGPT:** `/mcp` conserva su implementación y sus permisos OAuth en el mismo dominio, sin cambio de emisor ni audiencia.
- **Servicio de mensajería:** Matrix Continuwuity en Hetzner, con API en `https://chat.iaapp.live/_matrix/`. Esa dirección es infraestructura; no se requiere para entrar a la portada.
- **Código cliente y licencia:** FluffyChat, AGPL-3.0-or-later. El código fuente derivado está en `https://github.com/turbillon50/iaapp-chat` y conserva avisos de terceros.

## Construcción reproducible
1. `node scripts/prepare-chat.mjs` descarga la release `iaapp-web-f531a91` de `turbillon50/iaapp-chat` y verifica la huella SHA256 fija.
2. La compilación se extrae a `apps/web/public/chat-client` (generada, ignorada por Git).
3. Se establece `base href="/chat-client/"` para recursos JS/WASM y CSS internos sin colisionar con las rutas de sesión.
4. `npm run build:web` compila Next y empaqueta los archivos estáticos. Vercel lo ejecuta mediante el `buildCommand` versionado en `vercel.json`.

## Verificación previa
- Ejecución local Next.js 15 con Node 24: `/`, `/chat-client/index.html`, `/chat-client/flutter_bootstrap.js`, `/alta` responden HTTP 200 y archivo inexistente HTTP 404.
- Playwright Chrome móvil 390×844 y escritorio 1440×900: splash funcional, Flutter canvas renderizado, cero errores de JavaScript.
- CI GitHub Actions en branch de integración, comprobaciones y tests de repositorio.
- Preview Vercel READY con `/` y recursos Flutter HTTP 200. Los previews carecen de `IAAPP_AUTH_UPSTREAM` porque esa configuración existente solo está en producción: en preview `/mcp` da 503, **no equivale a una regresión de producción**.

## Protección y límites de aceptación
- Antes de dar la versión por finalizada, en producción verificar `GET /mcp` sin token → 401, `GET /.well-known/openid-configuration/api/auth` → 200, `GET /api/auth/get-session` → 200, `/sign-in` y `/alta` disponibles.
- La identidad Better Auth de IAapp aún **no está vinculada a una cuenta Matrix**. No confundir OAuth de ChatGPT hacia el MCP con «Continuar con ChatGPT» para entrar a la web.
- Todavía no se puede aprobar un chat real entre Luis y Acevedo, ni afirmar cifrado E2EE validado, federación o acceso automático a chats originales.
- La raíz IAapp aloja el cliente real, pero aún requiere unificación de identidad y QA de mensajería antes de iniciar el servicio comercial.

## Reversión
- Mantener como candidata de rollback la producción Vercel previa: `dpl_5GpXQptFYF2HPqFxJYy71B6LoBoM`.
- Si falla el control de OAuth/MCP, revertir desde Vercel a la última versión `READY` correcta y revertir la PR correspondiente; **no editar DNS de `iaapp.live`**.
- La infraestructura `chat.iaapp.live` no depende de retirar la versión antigua y no debe borrarse durante el rollback.

La afirmación «en producción» aplica al cliente publicado bajo el dominio principal; la integración completa de identidad y mensajería solo se declara terminada con pruebas reales.
