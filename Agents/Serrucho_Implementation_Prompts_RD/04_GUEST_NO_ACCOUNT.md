# 04 — Participación sin registro obligatorio

## Prompt para Antigravity

Implementa el principio de baja fricción: un participante invitado debe poder entrar a un Serrucho mediante un enlace seguro sin crear una cuenta obligatoriamente.

### Objetivo

Reproducir la principal ventaja funcional de Kittysplit: el enlace del grupo es suficiente para participar.

### Flujo

1. Creador crea Serrucho.
2. Sistema genera enlace seguro.
3. Creador comparte enlace.
4. Invitado abre enlace.
5. Sistema identifica que necesita seleccionar/confirmar su identidad dentro del Serrucho.
6. Invitado puede:
   - ver información permitida;
   - registrar sus gastos;
   - ver sus balances;
   - registrar/confirmar pagos según permisos.

### Seguridad

No usar IDs incrementales ni URLs predecibles como autorización.

Separar:
- identificador público;
- token secreto de acceso;
- permisos.

### Regla

No conceder acceso global a datos del usuario por tener un enlace.

### Criterios

- Funciona sin cuenta.
- Un invitado no puede acceder a Serruchos ajenos.
- El enlace no expone secretos internos.
- El usuario puede posteriormente vincularse a una cuenta sin perder su historial.

### Gate

Validar acceso autorizado, acceso no autorizado, expiración/revocación si aplica y vinculación posterior a cuenta.
