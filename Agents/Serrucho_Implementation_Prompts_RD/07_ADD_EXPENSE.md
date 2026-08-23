# 07 — Registrar gasto

## Prompt para Antigravity

Implementa el flujo principal de "Agregar gasto".

### Campos

- descripción;
- monto;
- moneda;
- fecha;
- persona que pagó;
- participantes afectados;
- método de pago opcional;
- categoría;
- nota opcional;
- adjuntos cuando la capacidad esté disponible.

### Tipos de movimiento

El formulario debe preparar la arquitectura para:
- gasto;
- transferencia;
- ingreso.

No mezclar las reglas matemáticas de estos movimientos.

### Reglas

- monto > 0;
- pagador obligatorio;
- al menos un participante afectado;
- fecha válida;
- categoría opcional o default configurable;
- el total debe poder reconciliarse con las partes.

### UX

La persona debe poder registrar un gasto común en pocos pasos.

Ejemplo:
"Uber — RD$850 — pagó Braulin — Braulin + Ana"

### Criterios

Al guardar:
- persistir correctamente;
- recalcular balances;
- actualizar overview;
- registrar actividad;
- evitar doble envío si el usuario toca guardar dos veces.

### Gate

Probar gasto normal, monto inválido, participantes parciales, edición y doble submit.
