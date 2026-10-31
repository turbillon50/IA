# Validación de la base visual

Estado: prototipo de diseño navegable. No constituye validación de un backend ni de una conexión MCP real.

## Evidencia comprobada

- JavaScript de las dos páginas: analizado por Node sin errores de sintaxis.
- JSON de diseño y despliegue: válido.
- Primera publicación Vercel: READY, commit `d9e1436c5f7809662eceb502ad2f9fad62977fba`.
- Se abrió y revisó el atlas en un navegador real: seis vistas móviles de 390 × 800 y una vista de escritorio de 1440 × 900, dentro de marcos de revisión.
- Crear un grupo con Luis, ALIX y Acevedo: el encabezado mostró `2 personas · 1 IA`.
- Escribir y enviar un mensaje: apareció con `Guardado en demo`; no se generó una respuesta artificial.
- Guardar un acuerdo seleccionando `Proyecto IAapp`: apareció con ese ámbito y autor Luis.
- Vincular una IA: el paso de emparejamiento conservó el nombre introducido y advirtió que el código era ilustrativo.

La revisión visual detectó y corrigió el ancho de los avatares de grupo, el monograma de la barra lateral, la altura y placeholder del campo de mensaje en móvil, el truncamiento de las vistas previas, la etiqueta accesible de Ajustes y los metadatos de grupos nuevos.

## Verificación final

- Código de interfaz revisado: commit `1fb7ed931e67d6a8dc981a6f3c4e7bfcbf31f54c`, deployment `dpl_47g2Rw8A1CAzsLQ6V142B8tLRR7B`, estado READY.
- Lista móvil: ancho visible y ancho de contenido de 390 px; sin desplazamiento horizontal.
- Lista de escritorio: ambos anchos de 323 px; sin desplazamiento horizontal.
- Campo de mensaje móvil: alto visible y alto de contenido de 48 px; sin barra vertical en vacío.
- Avatares y título del grupo separados: borde derecho de avatares en 118 px, inicio del título en 127 px.
- El último paso de vinculación muestra `Prueba de ida y vuelta · Pendiente`; no afirma una conexión real.
- Evidencia: [atlas capturado en navegador](visuals/iaapp-v1.jpg), [atlas interactivo](https://iaapp-design.vercel.app/screens.html).

Los errores observados en la consola de la sesión pertenecían a la extensión del navegador. Esta comprobación no equivale a una auditoría completa de accesibilidad o rendimiento.

## Pendiente para el producto real

- Autenticación y permisos de dos usuarios independientes.
- Ida y vuelta real con dos conversaciones de ChatGPT Work y cuentas distintas.
- Persistencia después de recargar; la maqueta solo conserva estado en memoria.
- Pruebas de teclado virtual, instalación PWA, accesibilidad completa y dispositivos iOS/Android físicos.
- Backend, migraciones, RLS, cola, reintentos, revocación y recuperación de conexiones.

Los marcos móviles prueban la adaptación del CSS al ancho indicado. No sustituyen un navegador móvil físico.
