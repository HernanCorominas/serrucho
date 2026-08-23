# 09 — División equitativa

## Prompt para Antigravity

Implementa la división equitativa de un gasto.

### Comportamiento

Si un gasto de RD$1,000 involucra 4 participantes, cada uno recibe una participación de RD$250.

El pagador también participa en la obligación, pero su pago debe reflejarse correctamente en el balance neto.

### Reglas de redondeo

Definir una política determinista para centavos.

No perder dinero por redondeo.

La suma de las partes debe ser exactamente igual al monto original en la unidad monetaria soportada.

### UX

Mostrar:
- monto total;
- participantes;
- monto por persona.

Permitir cambiar de estrategia mediante "Dividir diferente".

### Tests

Crear pruebas para:
- 2;
- 3;
- 4;
- números donde el monto no divide exactamente;
- DOP;
- monedas con distintos decimales.

### Gate

No continuar si existe diferencia entre monto original y suma de partes.
