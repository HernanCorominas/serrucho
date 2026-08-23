# 15 — Motor de balances y simplificación de deudas

## Prompt para Antigravity

Implementa el motor matemático central de Serrucho.

### Objetivo

Calcular:
- cuánto pagó cada persona;
- cuánto le correspondía;
- balance neto;
- quién debe;
- quién debe recibir;
- conjunto mínimo/práctico de transacciones para saldar el Serrucho.

### Principio

Si A debe a B y C, y B debe a C, no mostrar necesariamente todas las deudas originales. Resolver mediante balances netos.

Ejemplo conceptual:
- Carlos debe RD$10 a Pablo;
- Carlos debe RD$10 a Pedro;
- Pablo debe RD$10 a Pedro.

Resultado simplificado:
- Carlos paga RD$20 a Pedro.

### Reglas

1. El total de saldos netos debe ser 0.
2. No crear dinero.
3. No destruir dinero.
4. Cada settlement debe conservar el valor total.
5. El algoritmo debe ser determinista.
6. No asumir que la persona que pagó originalmente debe recibir directamente.
7. Permitir que la solución simplificada conecte personas que no tuvieron una transacción directa.

### Implementación

Separar:
- cálculo de balances;
- algoritmo de matching;
- presentación.

No mezclar lógica financiera con componentes UI.

### Tests obligatorios

- 2 participantes;
- 3;
- 5+;
- todos pagan;
- uno paga todo;
- ciclos;
- balances cero;
- transferencias;
- ingresos;
- división desigual.

### Gate

Este milestone es crítico. No avanzar si existen inconsistencias de centavos o balances.
