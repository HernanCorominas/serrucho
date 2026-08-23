# 14 — Ingresos, devoluciones y dinero recibido por el grupo

## Prompt para Antigravity

Implementa el movimiento "Ingreso".

### Casos

- devolución de depósito;
- reembolso de un hotel;
- dinero devuelto por un proveedor;
- aporte externo destinado al Serrucho.

### Datos

- quién recibió;
- monto;
- fecha;
- descripción;
- participantes beneficiados;
- categoría;
- comprobante opcional.

### Regla

Un ingreso debe reducir correctamente el costo neto soportado por los participantes según la distribución configurada.

### Ejemplo

Se devuelve un depósito de RD$3,000.

El sistema debe registrar el ingreso y recalcular balances.

### Criterios

No modelar ingresos como gastos negativos de forma improvisada. Crear una semántica explícita de Income para que los reportes sean correctos.
