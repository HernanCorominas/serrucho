# 13 — Transferencias, préstamos y dinero entregado entre participantes

## Prompt para Antigravity

Implementa el movimiento "Transferencia".

### Casos

- Ana le prestó RD$2,000 a Braulin.
- Carlos le dio RD$500 a Pedro.
- Un participante adelantó dinero a otro.
- Se registra dinero que ya fue transferido entre personas.

### Datos

- quién entrega;
- quién recibe;
- monto;
- fecha;
- nota;
- método de pago opcional;
- comprobante opcional.

### Reglas

Una transferencia no debe comportarse como un gasto grupal.

Debe modificar el balance entre las dos personas involucradas.

### UX

En el formulario de movimiento:
[Gasto] [Transferencia] [Ingreso]

### Criterios

Probar:
- préstamo;
- devolución parcial;
- devolución completa;
- transferencia entre personas que no tienen otros gastos;
- transferencia que interactúa con el algoritmo de settlement.
