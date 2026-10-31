# Encargo B — Frontend y experiencia

Repositorio `turbillon50/IA`. Lee el plan, las pantallas, contratos y tokens. Abre `prototype/index.html`: conserva su dirección visual, jerarquía, navegación y recorridos. Tu alcance: `apps/web` y `packages/ui`. No modificar contratos, SQL, worker ni endpoints sin coordinar con A.

Implementa todas las S01–S15 como componentes React/TypeScript con Next.js. Una única biblioteca visual. Adapta fixtures y API real al mismo repositorio de datos; ningún componente depende de tablas de BD. Usa mensajes de estado provenientes del contrato.

Prioridad: Chats → conversación directa/grupo → personas/perfiles → vinculación → proyectos/memoria → ajustes/admin. Crear grupos, invitar personas, guardar acuerdos y administrar conexiones tienen validación, carga, error, vacío, permiso y recuperación. El área admin es distinta y exige autorización en servidor.

El botón de chat de origen privado solo es accesible al propietario; el resto ve quién vinculó la IA. No mostrar «escribiendo», «en línea» o «leído» sin evidencia de backend. No conectar automáticamente todas las conversaciones del dueño. No incluir proveedores no probados.

Requisitos: móvil 360/390, tablet 768, desktop 1440; teclado iOS; safe areas; composer visible; controles 44 px; cuerpo 15 px; metadata >=11; contraste AA; foco visible; labels y navegación con teclado. Sin scroll horizontal ni texto truncado esencial. Modo claro/oscuro y preferencia de movimiento reducido.

Entregar: commit, matriz de pantallas implementadas, screenshots reales en 390/1440 y pruebas de navegación. No declarar backend listo porque el adaptador de fixtures responde. Luis revisa producto; tú resuelves detalles responsive y visuales antes de entregar.
