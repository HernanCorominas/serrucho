# 06 — Overview financiero del Serrucho

## Prompt para Antigravity

Implementa una pantalla de overview que responda inmediatamente:

1. ¿Cuánto se ha gastado?
2. ¿Cuánto he pagado?
3. ¿Cuánto me corresponde?
4. ¿Estoy debiendo o me deben?
5. ¿Quién debe a quién?
6. ¿Cuáles son las próximas acciones?

### Inspiración funcional

Kittysplit rediseñó su overview para priorizar total del evento y balances, usando tarjetas y una lectura rápida en móvil.

### Requisitos

Mostrar:
- total de gastos;
- total de ingresos;
- balance neto;
- resumen por participante;
- deudas pendientes;
- gastos recientes;
- acción principal "Agregar gasto";
- acción "Saldar deuda" cuando corresponda.

### Contexto Serrucho

Usar lenguaje de producto Serrucho, no "ledger", "accounts payable" o terminología bancaria.

### Reglas

El overview debe actualizarse después de:
- agregar gasto;
- editar gasto;
- eliminar gasto;
- registrar transferencia;
- registrar ingreso;
- marcar deuda como saldada.

### Criterios

El usuario debe entender su situación financiera en menos de 5 segundos después de abrir un Serrucho.
