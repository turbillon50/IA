# IAapp — Especificación de pantallas v1.0

Referencia ejecutable: `prototype/index.html`. El contenido es de demostración, los cambios viven en memoria y se reinician al recargar. No hace solicitudes de red, no registra usuarios ni ejecuta IAs.

## Sistema de interfaz

Dirección aprobada: negro absoluto, blanco perla, acentos lavanda, superficies discretas de cristal oscuro. Las iniciales distinguen personas e IAs con etiqueta; el color solo acompaña, no determina identidad o permisos. Tipografía serif en títulos de sección; sans serif de sistema para mensajes y controles. Sin iconos 3D genéricos ni paneles llenos de métricas inventadas.

Paleta y escala en `packages/contracts/design-tokens.json`. La implementación final las consume desde `packages/ui`. El prototipo incluye una variante clara para comprobar jerarquía; el objetivo visual principal es el tema oscuro.

### Shell responsive

- Móvil 360–759 px: topbar fija, cuatro accesos inferiores fijos, listas a una columna; conversación ocupa la pantalla y sustituye la navegación inferior por composer. Botón de regreso siempre visible.
- Tablet 760–1199 px: rail lateral y lista/conversación en dos columnas. Detalles del proyecto en panel bajo demanda.
- Desktop 1200+ px: rail 92, lista 324, conversación flexible, contexto 268 px. Evitar burbujas de texto excesivamente largas.
- Usar `100dvh`, safe areas y ajuste al teclado. El compositor se mantiene visible sin tapar los últimos mensajes. Respetar `prefers-reduced-motion`.
- Controles de producción: área táctil mínima 44×44, cuerpo >=14 px, mensaje >=15 px móvil, metadatos >=11 px. En el tablero de diseño los screenshots pueden mostrarse escalados; esa escala no cambia los tamaños reales de producción.

## Inventario cerrado para el piloto

| ID | Ruta final | Pantalla / acción principal | Estados requeridos |
|---|---|---|---|
| S01 | `/invite/:token` | Acceso por invitación; aceptar | válida, vencida, usada, correo incorrecto, acceso denegado |
| S02 | `/chats` | Bandeja; buscar / filtrar / crear | cargando, vacía, sin coincidencias, sin conexión |
| S03 | `/chats/:roomId` direct | Conversación con persona o IA | guardando, guardado, pendiente de respuesta, fallo, pausada |
| S04 | `/chats/:roomId` group | Grupo; menciones / destinatarios | participantes disponibles, permiso retirado, cola |
| S05 | modal en chats | Crear grupo; elegir miembros | validación, sin participantes elegibles, creado, error |
| S06 | `/projects` | Lista y creación de proyectos | vacío, activo, archivado, error |
| S07 | `/projects/:id` | Resumen, salas, tareas y archivos | sin acuerdos, sin tareas, sin archivos, sin permiso |
| S08 | `/memory` | Memoria por alcance y tipo | vacío, filtrado, cargando, sin permiso |
| S09 | `/memory/:id` | Acuerdo; origen y versiones | original, editado, historial, origen no disponible |
| S10 | `/people` | Personas e IAs; filtros | vacío, invitación pendiente, perfil revocado |
| S11 | `/participants/:id` | Perfil; dueño, origen, permisos | IA lista, sin prueba, pausada, expirada, revocada |
| S12 | `/connect` | Vincular IA: identidad → vinculación → prueba | código vigente/vencido, espera, fallo, comprobado |
| S13 | modal de proyecto/personas | Invitar humano; rol | pendiente, reenviar, vencida, aceptada, cancelada |
| S14 | `/settings` | Perfil, apariencia, avisos, conexiones | guardando, guardado, error, sesión vencida |
| S15 | `/admin` | Administración separada | sin rol, miembros, conexiones, entregas con error |

El prototipo cubre estas superficies; estados de muestra adicionales se seleccionan arriba (normal, espera, error, vacío). Las listas de estados anteriores son criterios para la implementación, no una afirmación de que ya estén conectados a datos reales.

## Recorridos que no se rediseñan por separado

1. Invitación → acceso → bandeja → Personas → vincular IA → prueba → conversación directa.
2. Bandeja → nuevo grupo → elegir humanos/IAs → mención → recepción del host → respuesta → guardar acuerdo.
3. Proyecto → sala → acuerdo → detalle del acuerdo → conversación de origen del acuerdo.
4. Perfil IA → administrar conexión → pausar/revocar → reconectar → nueva prueba real.
5. Administrador → invitar segunda persona → incorporación en su propia cuenta → segundo chat conectado.

## Componentes compartidos

`AppShell`, `TopBar`, `BottomTabs`, `NavRail`, `Avatar`, `ParticipantBadge`, `RoomRow`, `MessageBubble`, `DeliveryStatus`, `MessageComposer`, `MentionPicker`, `MemoryCard`, `ProjectCard`, `MemberPicker`, `ConnectionStepper`, `EmptyState`, `ErrorNotice`, `Dialog`, `Toast`, `Field`, `Button`, `Switch`.

Los contratos controlan variantes. El frontend no crea estados adicionales para mejorar visualmente la demo. `ready` requiere ida/vuelta comprobada. No usar presencia humana «en línea» para decir que una IA podrá contestar inmediatamente.

## Nombres visibles y evidencia

| Dato de dominio | Texto visible | Evidencia |
|---|---|---|
| mensaje persistido | Guardado | transacción de BD confirmada |
| entrega queued | En espera | entrega persistida |
| entrega received_by_host | Recibido por la conexión | callback 2xx |
| entrega reply_received | Respuesta recibida | respuesta persistida por tool autorizada |
| entrega failed | No se pudo entregar | fallo clasificado y reintentos agotados |
| conexión awaiting_probe | Comprobación pendiente | aún falta respuesta a prueba |
| conexión ready | Vinculada | prueba final correcta de esta generación |
| conexión paused | Pausada por su propietario | pausa guardada |
| conexión expired | Necesita reconexión | expiración de suscripción/credenciales |

Las entregas a múltiples destinatarios se muestran individualmente en detalles del mensaje. Una sola marca doble no puede representar que todas las IAs leyeron un mensaje.

## Interacciones y permisos

- Crear grupo exige nombre y al menos otro participante. Inicialmente solo se pueden invitar IAs de propietarios que ya pertenecen al espacio y aceptan compartirlas en esa sala.
- Guardar acuerdo exige título, contenido, alcance y referencia de origen cuando existe. No mezclar memoria privada y compartida en una búsqueda sin comprobar permisos.
- Un miembro puede salir de un grupo. Un administrador puede gestionar integrantes; la persona dueña controla la vinculación y revocación de su IA.
- Los enlaces privados de origen solo se muestran al propietario; para los demás aparece «Vinculada por…». El enlace de un acuerdo apunta a un mensaje autorizado de IAapp.
- Los archivos tienen nombre, tamaño, autor, fecha y alcance; no solicitar permisos de cámara/micrófono durante el onboarding si no se utilizan.
- Los errores se explican con una acción de recuperación. Mostrar detalles técnicos solo en administración o diagnóstico solicitado.

## Prototipo e implementación

Abrir `prototype/index.html` o servirlo con `python -m http.server 8080 -d prototype`. Parámetros de revisión: `?screen=projects`, `?screen=project`, `?screen=memory`, `?screen=memory-detail`, `?screen=people`, `?screen=profile`, `?screen=connect`, `?screen=settings`, `?screen=welcome`, `?screen=admin`, `?room=alix`, `?room=paradox`, `?room=paradox&state=waiting`.

El prototipo es la referencia visual, no código de producción. Migrar a componentes React conservando jerarquía y recorridos. La barra «Datos de ejemplo» pertenece al entorno de demo y nunca se mezcla con datos de producción. Sin respuestas artificiales presentadas como respuestas reales.
