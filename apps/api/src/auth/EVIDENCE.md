# Evidencia: autenticación propia y número IAapp

Fecha: 31-oct-2026. Base: main `46c1982`.

Verificación ejecutada en Node 24.22.1:

- `npm run check`: TypeScript conjunto sin errores.
- `npm test`: 26 pruebas, 26 aprobadas, 0 fallidas.
- `node --experimental-strip-types --test apps/api/src/auth/self-hosted.test.ts`:
  recorrido adicional HTTP de login/logout/relogin aprobado.
- `git diff --check`: sin errores de espacios.

La nueva prueba utiliza migraciones 001/002/003, Postgres embebido y Better Auth
1.7.14 con su proveedor OAuth real. El cliente es sintético, con callback de
prueba: no corresponde a una cuenta de ChatGPT ni usa credenciales remotas.

Comprobado:

1. Cuenta local, consentimiento, código OAuth, PKCE S256 y token propio firmado.
2. Verificador PKCE incorrecto rechazado; código consumido no reutilizable.
3. MCP rechaza falta de token y firma alterada.
4. Perfil y número corresponden a la sesión humana y a `/api/v1/me`.
5. Número numérico permanente, estable tras recrear servicio y volver a entrar.
6. Una segunda cuenta recibe identidad diferente; sender_id del cliente falla.
7. Logout invalida el acceso MCP asociado a esa sesión.
8. Descubrimiento OAuth anuncia emisor correcto y S256.
9. Consentimiento sin firma y alta pública de usuarios rechazados.
10. HTML de login servido por HTTP; CSP aplicada y JavaScript válido.

Las pruebas existentes siguen verificando aislamiento entre propietarios y un
tercero, revocaciones, idempotencia, RLS, archivos privados y persistencia del
outbox. Las migraciones y configuraciones remotas no se tocaron.

No acreditado por estas pruebas: despliegue en Hetzner, alta real del cliente de
ChatGPT, retorno OAuth real, o ejecución de `get_my_profile` desde ChatGPT. La
preparación y el único recorrido para comprobarlo están en SELF_HOSTED_HANDOFF.md.

Comprobación adicional de integración web: `npm run check:web` aprobado.
`npm run build:web` no se pudo completar en este ejecutor: Next falla con
`ENOENT uv_resident_set_memory`. No se modificó frontend para sortearlo; comprobar
el build en CI o en un ejecutor compatible antes de integrar a main.
