# Integración A — 31 de octubre de 2026

## Entregas recibidas

| Frente | Entrega revisada | Resultado |
|---|---|---|
| C · Backend | PR #2, `18bc745336ac30dcca2737f7e0a9bcd442ef3964` | Código de datos, permisos y REST reunido con MCP en un mismo árbol; pruebas sintéticas verificadas. |
| D · MCP | PR #1, `888417d7dac5e8224d1b70bc56f96f16d0c26d87` | Transporte y worker reunidos; no activados con repositorios ficticios. |
| B · Frontend | No había rama, PR ni `apps/web` en el inventario consultado | Falta recibir su entrega publicada. El prototipo HTML continúa al aire. |

Esta es una integración de código y contratos. No acredita todavía un piloto conectado con cuentas reales.

## Trabajo de integración

- Entrada raíz reproducible: `npm ci --ignore-scripts`, `npm run bootstrap`, `npm run check`, `npm test`.
- TypeScript estricto comprueba conjuntamente contratos, datos, autenticación, REST, MCP, worker y pruebas.
- `createApplication` reúne REST y el punto de montaje MCP sin consumir antes su cuerpo JSON. Las sesiones humanas y OAuth MCP permanecen separadas.
- El arranque de API usa esa composición. `/healthz` comprueba que el proceso responde; no acredita disponibilidad de Postgres. Sin configuración MCP completa, `/mcp` y su metadata responden 503, y health indica `mcp: disabled`.
- Contrato v1.1: envolturas de respuestas, versión de tareas, resumen autorizado de proyecto, aceptación de sala, revocación y feed incremental.
- CI comprueba tipos y pruebas al recibir cambios en main o una PR. No usa secretos de producción ni aplica migraciones.
- Se mantiene el despliegue estático existente; ninguna variable de producción ni esquema remoto se modifica por esta integración.

## Diferencias que bloquean activar MCP

1. **Suscripción:** el transporte genera `sub_<hash>`; `subscriptions.id` es UUID. El adaptador debe mantener un identificador público separado y la clave interna, junto con identidad OAuth y generación.
2. **Respuesta:** el transporte entrega `capabilityHash` y espera `completeDelivery`; datos recibe la capacidad en claro en `respond`. La transición debe verificar una única capacidad sin exponerla a la PWA y sin aplicar hash dos veces.
3. **Scopes:** transporte exige `iaapp:connect`/`iaapp:respond`; persistencia exige `deliveries:respond`. Formalizar la traducción tras verificar OAuth; no copiar scopes declarados por el modelo.
4. **Probe inicial:** faltan consumo transaccional de emparejamiento, suscripción, evento de prueba y confirmación. La persistencia actual de entregas exige una conexión ya `ready`; no se puede usar para saltarse la comprobación inicial.
5. **Reintentos:** el worker exige envelope cifrado estable. Datos conserva `eventId` pero emite otra capacidad en cada `issueReplyCapability`; falta persistir y reutilizar el envelope/capacidad hasta su vencimiento.
6. **Concesiones y resultados:** datos usa 30 s; worker propone 60 s. El worker clasifica estados terminales más ampliamente que `recordHostResult`. Un adaptador debe armonizarlos, preservar respuestas concurrentes y cancelar trabajo revocado.

Estas diferencias no se solucionan importando una clase ni asignando `as any`. No hay adaptador de producción ni fallback en memoria habilitado.

## Verificación reproducida

- 13 pruebas backend/Postgres embebido, incluidas persistencia tras reapertura, revocación, idempotencia, aislamiento y RLS.
- 9 pruebas transporte/worker, con dobles explícitos de repositorio y callback.
- 2 pruebas nuevas de composición HTTP: REST protegido con MCP desactivado; cuerpo MCP intacto y token OAuth separado de sesión humana.
- Compilación TypeScript conjunta sin errores.

Ninguna prueba utilizó dos cuentas ChatGPT reales. OAuth registrado, Postgres remoto, Storage privado, worker supervisado, frontend de producción e ida/vuelta siguen pendientes. No inferirlos de pruebas unitarias ni del estado READY de la demo estática.

## Siguiente entrega

Recibir la PR del frontend; adaptar su cliente al contrato v1.1; implementar y probar persistencia MCP y probe; configurar recursos existentes y OAuth; validar con Luis y Acevedo en cuentas diferentes. Abrir calidad E cuando ese recorrido esté ejecutable.
