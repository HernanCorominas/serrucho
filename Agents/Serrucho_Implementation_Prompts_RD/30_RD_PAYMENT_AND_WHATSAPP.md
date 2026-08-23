# 30 — Adaptación dominicana: métodos de pago y recordatorios por WhatsApp

## Prompt para Antigravity

Implementa una capa específica de Serrucho para el contexto dominicano.

**Esta funcionalidad NO debe presentarse como una copia literal de Kittysplit. Es una adaptación de producto para Serrucho.**

### A. Métodos de pago

Cuando un usuario marca una deuda como pagada, permitir registrar el método:

- efectivo;
- transferencia bancaria;
- depósito;
- pago móvil;
- tarjeta;
- otro.

No asumir que todos los usuarios usan el mismo banco o proveedor.

Permitir una nota opcional:
"Transferencia hecha desde mi cuenta."

### B. Recordatorio por WhatsApp

Serrucho debe permitir enviar un recordatorio al participante que todavía tiene una deuda pendiente.

Canal principal: WhatsApp, no SMS.

### Flujo

1. Identificar deuda pendiente.
2. Mostrar botón "Recordar por WhatsApp".
3. Generar mensaje editable.
4. Abrir WhatsApp con el destinatario y mensaje cuando técnicamente sea posible.
5. No enviar silenciosamente ni hacer spam.
6. Registrar que el usuario solicitó el recordatorio, no afirmar que el pago ocurrió.

### Mensaje

Ejemplo:
"¡Hey! 👋 Te recuerdo que tienes pendiente RD$1,250 del Serrucho [NOMBRE]. Cuando puedas, saldamos esa parte. Gracias 🙌"

### Reglas

- consentimiento y privacidad;
- no exponer balances a terceros;
- no automatizar mensajes sin una acción clara del usuario en la primera versión;
- rate limiting para evitar abuso;
- permitir editar el texto.

### Criterios

- WhatsApp disponible;
- WhatsApp no disponible;
- teléfono faltante;
- deuda cero;
- deuda ya saldada;
- usuario bloqueado/inválido.

### Nota

Si en el futuro se implementan notificaciones automáticas, separar:
- recordatorio manual;
- push;
- WhatsApp Business/API;
- automatización programada.

No fingir que abrir WhatsApp equivale a enviar un mensaje.
