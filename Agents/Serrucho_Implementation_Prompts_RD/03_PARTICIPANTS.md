# 03 — Participantes y gestión del grupo

## Prompt para Antigravity

Implementa la gestión completa de participantes de un Serrucho.

### Funcionalidades

- agregar participante;
- editar nombre;
- eliminar participante cuando las reglas de integridad lo permitan;
- identificar creador;
- asignar identificador estable;
- opcionalmente asociar teléfono/WhatsApp;
- opcionalmente asociar cuenta de usuario.

### Reglas

Un participante no debe depender obligatoriamente de una cuenta.

Debe ser posible tener:
- usuario registrado;
- invitado;
- participante agregado manualmente.

No borrar físicamente un participante que tenga transacciones históricas sin resolver la integridad. En ese caso utiliza desactivación/soft delete o impide la eliminación explicando el motivo.

### Contexto RD

Permitir teléfono con formato internacional, priorizando +1 para República Dominicana, sin bloquear otros países.

El teléfono debe ser opcional.

### UX

Mostrar identidad visual consistente. Si Serrucho ya tiene avatares, reutilizarlos. Si no, crear una representación simple que permita distinguir participantes rápidamente.

### Criterios de aceptación

- CRUD seguro de participantes.
- No se rompe el historial financiero.
- Un invitado puede participar sin cuenta.
- Un participante puede convertirse posteriormente en usuario registrado sin duplicarse.
- El teléfono nunca se muestra públicamente sin necesidad.

### Gate

Probar creación, edición, eliminación/desactivación, invitado y usuario registrado antes de continuar.
