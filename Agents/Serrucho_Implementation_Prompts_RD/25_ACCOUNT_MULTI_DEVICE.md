# 25 — Cuenta opcional y multi-dispositivo

## Prompt para Antigravity

Implementa una cuenta opcional.

### Principio

El registro no debe ser obligatorio para crear/participar en un Serrucho.

### Beneficios de la cuenta

- ver Serruchos asociados;
- recuperar acceso;
- cambiar de dispositivo;
- vincular Serruchos creados como invitado;
- gestionar perfil.

### Flujo de vinculación

Un invitado entra sin cuenta.
Posteriormente crea/inicia sesión.
El sistema debe permitir vincular de forma segura el participante anónimo a la cuenta correcta.

### Seguridad

Nunca vincular automáticamente por nombre solamente.

Usar token, confirmación o mecanismo equivalente.

### UX

No interrumpir la experiencia principal con popups insistentes de registro.

### Criterios

- guest → account;
- account → nuevo dispositivo;
- recuperación;
- múltiples Serruchos;
- logout/login;
- no duplicación de participantes.
