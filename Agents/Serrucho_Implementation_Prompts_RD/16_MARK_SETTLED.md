# 16 — Marcar deuda como saldada

## Prompt para Antigravity

Implementa "Marcar como saldado".

### Objetivo

Cuando una persona efectivamente paga una deuda, registrar que el settlement ocurrió sin borrar el historial financiero.

### Flujo

1. Mostrar deuda pendiente.
2. Usuario selecciona "Marcar como saldado".
3. Confirmar:
   - quién paga;
   - quién recibe;
   - monto;
   - fecha.
4. Registrar settlement.
5. Actualizar estado.
6. Mantener historial.

### Importante

No eliminar el gasto original.

El settlement representa el cumplimiento de la obligación, no la desaparición del gasto.

### Estados

Como mínimo:
- pendiente;
- saldado.

Diseñar extensible para:
- parcial;
- disputado;
- cancelado.

### Contexto RD

Permitir registrar método:
- efectivo;
- transferencia bancaria;
- depósito;
- pago móvil;
- otro.

No asumir un proveedor de pago específico.

### Criterios

La deuda desaparece de pendientes solo cuando corresponde y el historial conserva evidencia.
