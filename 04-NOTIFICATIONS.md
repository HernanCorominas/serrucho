# AGENT — NOTIFICATIONS

## Misión
Implementar comunicación automática con participantes sin acoplar Serrucho a un proveedor.

## Canal obligatorio
Email mediante Resend.

## Canal opcional
WhatsApp mediante Meta WhatsApp Cloud API si las variables de entorno están configuradas.

## Arquitectura
Crear:
- NotificationProvider
- EmailNotificationProvider
- WhatsAppNotificationProvider
- NotificationRouter

El Router decide:
1. Si el participante tiene canal preferido configurado.
2. Si el proveedor está disponible.
3. Si falla, registrar el error.
4. Nunca romper el cierre del serrucho por una falla de notificación.

## Eventos
### PARTICIPANT_ADDED
Cuando se agrega un participante, el sistema puede enviar una invitación/enlace al serrucho. Esta automatización es configurable.

### SETTLEMENT_READY
Cuando el serrucho se cierra:
- generar snapshot;
- generar URL pública segura;
- enviar estado de cuenta.

### REMINDER
No implementar scheduler complejo en MVP. Dejar preparado el evento para recordatorios futuros.

## Email
Crear templates HTML responsive:
- invitación;
- estado de cuenta;
- error/fallback.

El email del estado debe contener:
- "Serrucho cerrado";
- nombre del participante;
- monto a pagar/recibir;
- detalle resumido;
- instrucciones de pago;
- fecha límite;
- botón "Ver mi estado de cuenta".

## Seguridad
No poner tokens de acceso en logs.
No incluir secretos.
Los enlaces públicos deben usar token aleatorio de alta entropía.

## Idempotencia
No enviar dos veces el mismo evento si ya existe un envío exitoso para el mismo snapshot + participante + canal, salvo que el usuario solicite reenvío.

## Variables
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_TEMPLATE_NAME

WhatsApp debe poder quedar desactivado sin afectar el sistema.
