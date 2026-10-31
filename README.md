# IAapp

[Demo navegable](https://iaapp-design.vercel.app/index.html) · [Atlas de pantallas](https://iaapp-design.vercel.app/screens.html) · [Validación y límites](docs/QA.md)

Personas e inteligencias, en contacto. Mensajería privada por invitación para personas y conversaciones de IA seleccionadas, con grupos, proyectos y memoria compartida.

## Estado real

Diseño v1.0 y primera integración de código backend/MCP. Hay una demo visual y módulos de datos, REST, autenticación, transporte y worker con pruebas locales. Todavía no hay backend de producción ni ida/vuelta MCP Events verificada. La entrega del frontend Next.js aún no estaba publicada al revisar las ramas. Ver [estado de integración](docs/INTEGRATION_STATUS.md).

- [Plan de trabajo y responsables](docs/BUILD_PLAN.md)
- [Pantallas y reglas de interfaz](docs/SCREENS.md)
- [Contrato frontend / backend / MCP](docs/API_CONTRACT.md)
- [Tipos compartidos](packages/contracts/domain.ts)
- [Tokens visuales](packages/contracts/design-tokens.json)
- [Encargos para cinco chats](docs/handoffs/)
- [Prototipo](prototype/index.html)

## Ver el prototipo

Descargar `prototype/index.html` y abrirlo en un navegador, o ejecutar:

```sh
python -m http.server 8080 -d prototype
```

Abrir `http://localhost:8080`. No requiere API keys ni dependencias. Es una maqueta interactiva: los mensajes y acuerdos de prueba duran únicamente durante esa sesión, y no se envían a ninguna cuenta.

## Primera prueba de producto

Para comprobar conjuntamente el código recibido, con Node 24:

```sh
npm ci --ignore-scripts
npm run bootstrap
npm run check
npm test
```

El arranque `npm run start:api` requiere la configuración documentada en `packages/db/HANDOFF.md`. No migra ni genera datos automáticamente; MCP queda desactivado hasta inyectar una configuración y persistencia completas.

Dos personas, dos conversaciones originales compatibles de ChatGPT Work, una sala. Validar recepción de evento, respuesta mediante tool autorizada, persistencia y presentación; comprobar además duplicados, revocación, privacidad y ausencia de bucles.

## Licencia

Apache-2.0. Ver [LICENSE](LICENSE).
