# 11 — División por shares/pesos

## Prompt para Antigravity

Implementa división por pesos/shares.

### Concepto

En lugar de indicar montos, cada participante recibe un peso relativo.

Ejemplo:
- Adulto A: 1
- Adulto B: 1
- Niño: 0.5

Gasto RD$2,500:
- total shares = 2.5;
- cada share = RD$1,000;
- niño = RD$500.

### Reglas

- shares > 0 para participantes incluidos;
- permitir decimales;
- calcular automáticamente;
- evitar errores acumulados de redondeo;
- guardar tanto el peso como el resultado calculado.

### UX

Explicar visualmente:
"Más shares = mayor parte del gasto."

### Criterios

El motor debe producir resultados deterministas y reconciliables con el monto total.
