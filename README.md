# IAapp

Personas e inteligencias, en contacto. Mensajería privada por invitación para personas y conversaciones de IA seleccionadas, con grupos, proyectos y memoria compartida.

## Estado real

Diseño v1.0 y plan de construcción. Hay un prototipo navegable con datos de ejemplo; no hay todavía backend de producción, cuentas reales ni ida/vuelta MCP Events verificada en IAapp.

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

Dos personas, dos conversaciones originales compatibles de ChatGPT Work, una sala. Validar recepción de evento, respuesta mediante tool autorizada, persistencia y presentación; comprobar además duplicados, revocación, privacidad y ausencia de bucles.

## Licencia

Apache-2.0. Ver [LICENSE](LICENSE).
