# 05 — Compartir Serrucho por WhatsApp y otros canales

## Prompt para Antigravity

Implementa el sistema de invitación y compartir Serruchos.

Kittysplit utiliza un enlace secreto que puede compartirse por email o chat. Para Serrucho, WhatsApp debe ser el canal social principal en República Dominicana.

### Funcionalidades

- copiar enlace;
- compartir enlace mediante Web Share API cuando exista;
- botón WhatsApp;
- compartir por otras aplicaciones disponibles;
- mensaje de invitación generado automáticamente;
- QR opcional para abrir el Serrucho.

### Mensaje

Generar un mensaje corto y editable, por ejemplo:

"Únete al Serrucho de [NOMBRE]. Entra aquí para ver los gastos y registrar lo que pagaste: [LINK]"

No hardcodear el texto en múltiples lugares.

### Reglas

- El enlace debe ser seguro.
- No incluir información financiera sensible en el mensaje.
- El usuario debe poder copiar el enlace sin abrir WhatsApp.
- Si WhatsApp no está instalado, ofrecer copiar enlace/compartir por sistema.

### Criterios

- Android.
- iOS.
- navegador desktop.
- WhatsApp.
- copiar enlace.
- Web Share cuando esté disponible.

### Gate

Comprobar que una persona que recibe el enlace puede abrir el Serrucho y completar el flujo de invitado.
