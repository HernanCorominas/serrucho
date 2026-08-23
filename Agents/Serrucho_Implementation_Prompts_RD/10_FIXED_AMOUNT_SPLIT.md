# 10 — División por monto individual

## Prompt para Antigravity

Implementa división desigual especificando cuánto corresponde a cada participante.

### Ejemplo

Gasto: RD$2,000

- Ana: RD$500
- Braulin: RD$500
- Carlos: RD$1,000

La suma debe ser exactamente RD$2,000.

### Reglas

- permitir introducir monto individual;
- recalcular restante;
- mostrar faltante/exceso;
- impedir guardar mientras no cierre exactamente;
- permitir que el pagador tenga una participación diferente;
- mantener precisión monetaria.

### UX

No obligar al usuario a hacer matemáticas manualmente.

Mostrar:
"Asignado: RD$1,500 / RD$2,000"
"Faltan: RD$500"

### Criterios

La transacción solo se guarda si la suma de partes coincide con el total.
