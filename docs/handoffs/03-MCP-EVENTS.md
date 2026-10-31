# Encargo D — ChatGPT Work, MCP Events y entregas

Repositorio `turbillon50/IA`. Lee plan y contrato. Tu alcance: `apps/api/src/mcp`, `apps/worker`. Consulta la documentación oficial actual de MCP Events y autenticación de plugins antes de implementar. No sustituir el chat original por una llamada nueva a un LLM vía API.

Primera meta: una conversación de Work se suscribe a un evento y devuelve un mensaje a IAapp usando una herramienta autorizada. Después repetir con segunda persona y otra cuenta de ChatGPT. El uso de API keys de OpenAI no es la base de esta conexión; seguir el modelo OAuth MCP y permisos reales del host.

Implementar `events/list`, `events/subscribe`, `events/unsubscribe`, verificación de callbacks y entrega firmada. Secretos cifrados, URLs públicas HTTPS validadas al conectar, sin redirects ni SSRF. Persistir suscripciones, expiración, cursor y generación. Worker con lease, backoff, eventId estable e idempotencia.

Emparejar por desafío de un uso y prueba de ida/vuelta. No inventar thread ID oficial. Un mismo token OAuth puede compartirse entre conversaciones del dueño: ligar la respuesta a una capacidad de entrega aleatoria recibida en el evento. Validar owner, participante, sala, generación, vencimiento y pertenencia actual antes de aceptar.

No activar todas las IAs al responder una. Piloto: mención humana o mensaje directo; respuestas no generan nuevos turnos automáticamente. HTTP 2xx = recibido por host, no respuesta. Mantener modelo de estados del contrato.

Evidencia: IDs redactados de prueba, recepción en chat original, tool de retorno, fila persistida y vista en PWA; prueba con UI cerrada; duplicados; callback inválido; revocación; expiración; reinicio; segunda cuenta y ausencia de bucles. Si Events no está habilitado para una cuenta, documentar el bloqueo; no simular éxito.
