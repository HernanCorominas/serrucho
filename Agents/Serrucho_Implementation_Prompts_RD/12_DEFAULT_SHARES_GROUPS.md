# 12 — Default shares y grupos/familias/parejas

## Prompt para Antigravity

Implementa la funcionalidad de pesos predeterminados por participante, inspirada en Default Shares de Kittysplit.

### Objetivo

Permitir que ciertos participantes representen grupos o que una familia/pareja tenga un peso compuesto.

### Ejemplos

Pareja:
- Pareja X = 2 shares.

Familia:
- Adulto = 1
- Adulto = 1
- Niño = 0.5

Grupo:
- "Familia Pérez" = 3 shares.

### Comportamiento

Cuando se crea un gasto nuevo:
- cargar automáticamente los default shares;
- permitir modificarlos exclusivamente para ese gasto;
- no alterar la configuración global.

### Regla crítica

Modificar shares de un gasto histórico no debe cambiar automáticamente los demás gastos.

### Criterios

- configuración persistente;
- aplicación automática;
- override por gasto;
- soporte decimal;
- recalculo correcto.

### Serrucho

No mostrar esto como una función contable avanzada. Presentarlo como:
"¿Cómo quieres repartir normalmente los gastos entre ustedes?"
