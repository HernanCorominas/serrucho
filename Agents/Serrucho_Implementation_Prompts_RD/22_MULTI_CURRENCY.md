# 22 — Múltiples monedas y conversión

## Prompt para Antigravity

Implementa soporte de múltiples monedas para Serruchos que lo necesiten.

### Moneda local

DOP debe ser la moneda predeterminada para Serruchos creados en contexto dominicano.

### Comportamiento

Un Serrucho puede tener:
- moneda base;
- gastos en otras monedas;
- conversión a moneda base;
- balance final expresado en moneda base.

### Ejemplo

Moneda base: DOP

Gasto:
USD 100

El sistema debe:
- guardar monto original;
- guardar moneda original;
- guardar tasa utilizada;
- calcular equivalente DOP;
- preservar trazabilidad.

### Tasa histórica

Inspirado en Kittysplit:
usar la tasa correspondiente a la fecha del gasto cuando la fuente lo permita.

### Ajuste manual

Kittysplit actualmente permite ajustar la tasa de cambio de gastos extranjeros en Super Kitty. Serrucho debe permitir:
- tasa automática;
- override manual;
- guardar quién ajustó;
- guardar cuándo;
- mostrar claramente que fue ajustada.

### Regla

Editar un gasto no debe cambiar silenciosamente la tasa si no cambia la fecha, salvo que el usuario solicite recalcular.

### Criterios

No perder el monto original ni producir diferencias inexplicables.
