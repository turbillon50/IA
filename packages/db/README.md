# @iaapp/db

Postgres, ACL y persistencia de IAapp. [Relevo técnico](HANDOFF.md), [evidencia](EVIDENCE.txt).

```sh
npm ci --prefix packages/db
npm ci --prefix apps/api/src/auth
npm ci --prefix apps/api/src/rest
npm test --prefix packages/db
npm run check --prefix packages/db
npm run check --prefix apps/api/src/rest
```

Node 24. API: `npm start --prefix apps/api/src/rest`. Migraciones contra una BD existente configurada mediante `IAAPP_DATABASE_URL`: `npm run migrate --prefix packages/db`. No hay seed automático ni servicios provisionados. Las pruebas usan únicamente usuarios y servicios sintéticos.

Para integrar, importar `Repository`, `Files`, `Connections`, `DeliveryRepository` y `createRestApp`; ver el relevo antes de conectar identidad, Storage, Realtime o el transporte MCP.
