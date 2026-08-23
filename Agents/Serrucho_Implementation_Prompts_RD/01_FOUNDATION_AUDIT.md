# 01 — Auditoría y preparación del fundamento de Serrucho

## Prompt para Antigravity

Antes de implementar nuevas funcionalidades de Serrucho, realiza una auditoría técnica del estado actual del proyecto.

No construyas funcionalidades nuevas todavía. El objetivo de este milestone es establecer una línea base verificable para que todos los siguientes prompts puedan ejecutarse de forma incremental.

### Tareas

1. Inspecciona frontend, backend, base de datos, autenticación, navegación, modelos, servicios, APIs y componentes reutilizables.
2. Identifica qué partes de Serrucho ya implementan:
   - planes/serruchos;
   - participantes;
   - gastos;
   - balances;
   - deudas;
   - compartir;
   - registro/login;
   - almacenamiento de datos;
   - adjuntos;
   - notificaciones.
3. No reemplaces implementaciones existentes que funcionen.
4. Documenta las entidades y relaciones actuales.
5. Identifica gaps respecto al modelo funcional que se va a construir.
6. Define los puntos de extensión para:
   - Expense;
   - Participant;
   - Split;
   - Transfer;
   - Income;
   - Settlement;
   - Category;
   - Attachment;
   - Activity/History;
   - Share Link;
   - ReadOnly Access.
7. Comprueba que el proyecto compila y que las pruebas existentes pasan.
8. Crea/actualiza documentación técnica del estado real del proyecto.

### Regla

No implementar features de Kittysplit en este milestone. Solo preparar el terreno.

### Criterios de aceptación

- El proyecto compila.
- Las pruebas existentes pasan o quedan documentadas las fallas preexistentes.
- Existe un mapa de arquitectura actualizado.
- Existe una lista de gaps priorizada.
- No se rompió ninguna funcionalidad existente.

### Gate

No avanzar al archivo 02 hasta que el repositorio esté en estado estable y el informe de auditoría esté guardado.
