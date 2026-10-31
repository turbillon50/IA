# Encargo E — Calidad y entrega

Repositorio `turbillon50/IA`. Alcance: `tests/e2e`, `infra`, `docs/evidence`. Lee BUILD_PLAN, SCREENS y API_CONTRACT. Tu objetivo es entregar evidencia verificable del producto completo.

Preparar Playwright con datos de prueba y dos usuarios más un tercero sin permiso. Recorrer invitación, acceso, vinculación de IA, mensaje directo, grupo por mención, proyecto, archivo y acuerdo. Separar pruebas con fixtures de pruebas reales de Events.

Capturas a 390×844 y 1440×960, además de comprobaciones 360 y 768. Revisar foco, controles, estados, contraste y overflow. Teclado iOS, instalación PWA y avisos requieren dispositivo real: si no se probaron, declararlo. No cerrar con «se ve bien» sin capturas ni validación de interacción.

Backend: pérdida/reintento/duplicado, revocación en vuelo, cuenta distinta, generación anterior, capacidad expirada, acceso cruzado, archivos privados, reconexión Realtime y restauración. Un callback 2xx no prueba ejecución terminada.

Despliegue: web Vercel y API/worker Railway solo cuando estén configurados; separar dev/prod. Variables mediante gestores de secretos. Healthchecks, migraciones controladas, rollback y monitor de entregas fallidas. Verificar URLs y flujo completo antes de reportar producción.

Entregar al integrador: matriz pass/fail/blocked, comandos, SHA exacto, screenshots, fechas, limitaciones y riesgos materiales. No reescribir estilos para esconder fallos; reportarlos al dueño del componente.
