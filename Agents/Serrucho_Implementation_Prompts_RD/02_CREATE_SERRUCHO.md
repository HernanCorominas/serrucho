# 02 — Crear un Serrucho/Plan

## Prompt para Antigravity

Implementa el flujo completo para crear un nuevo Serrucho, tomando como referencia conceptual la creación de un Kitty de Kittysplit, pero adaptándolo al producto Serrucho.

### Objetivo

Una persona debe poder crear un Serrucho para una actividad concreta sin enfrentarse a un onboarding financiero complejo.

### Datos mínimos

- nombre del Serrucho;
- descripción opcional;
- moneda local, con DOP/RD$ como default para usuarios en República Dominicana;
- creador;
- fecha de creación;
- participantes iniciales opcionales.

Ejemplos:
- "Fin de semana en Juan Dolio"
- "Cena de cumpleaños"
- "Serrucho del apartamento"
- "Viaje a Punta Cana"
- "Compra de regalo"

### Reglas

1. La creación debe ser rápida.
2. No obligar a registrar a todos los participantes.
3. El creador debe poder añadir participantes después.
4. Un Serrucho recién creado debe quedar en estado consistente aunque todavía no tenga gastos.
5. Validar nombre obligatorio.
6. No permitir moneda inválida.
7. El sistema debe generar un identificador/enlace seguro para compartir el Serrucho.

### UX

Priorizar mobile-first:
- nombre;
- moneda;
- participantes;
- botón "Crear Serrucho".

No convertir el formulario en un sistema contable.

### Criterios de aceptación

- Se puede crear un Serrucho sin gastos.
- El Serrucho queda persistido.
- El creador puede entrar inmediatamente al overview.
- Se genera enlace seguro.
- DOP aparece como opción por defecto cuando corresponda.
- La creación funciona en desktop y móvil.

### Gate

No avanzar hasta que crear y abrir un Serrucho sea estable y esté probado.
