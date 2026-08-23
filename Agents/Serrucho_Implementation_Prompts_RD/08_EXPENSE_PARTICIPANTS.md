# 08 — Elegir quién participa en cada gasto

## Prompt para Antigravity

Implementa selección de participantes por gasto.

### Regla principal

No todos los gastos de un Serrucho necesariamente involucran a todos.

Ejemplos dominicanos:
- una cena donde 2 personas no fueron;
- gasolina para quienes fueron al viaje;
- una compra del apartamento;
- un regalo comprado solo por algunos;
- delivery compartido entre 3 personas.

### UX

Por defecto:
- seleccionar todos los participantes.

Permitir:
- desmarcar;
- seleccionar varios;
- seleccionar todos;
- buscar participantes si el grupo es grande.

Mostrar inmediatamente quién está incluido.

### Integridad

El sistema debe impedir guardar un gasto sin participantes.

El algoritmo de división debe trabajar únicamente con los participantes seleccionados.

### Criterios

Agregar un gasto a 2 de 5 personas no debe afectar el saldo de las otras 3.
