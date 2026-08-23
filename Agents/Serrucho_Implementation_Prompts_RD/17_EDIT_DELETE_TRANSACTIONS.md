# 17 — Editar y eliminar movimientos

## Prompt para Antigravity

Implementa edición y eliminación segura de gastos, transferencias e ingresos.

### Reglas

Al editar:
1. validar nuevamente;
2. recalcular distribución;
3. recalcular balances;
4. recalcular settlements;
5. registrar modificación en historial.

Al eliminar:
1. confirmar;
2. eliminar o desactivar según modelo;
3. recalcular;
4. registrar quién lo hizo y cuándo.

### Protección

No permitir que una edición deje:
- suma de partes incorrecta;
- balance inconsistente;
- referencias rotas;
- settlement imposible de explicar.

### UX

Desde "Todos los movimientos":
- tocar movimiento;
- ver detalle;
- editar;
- eliminar.

### Criterios

Crear un gasto, editar monto, editar participantes, editar pagador, eliminarlo y comprobar que todo el Serrucho vuelve a un estado matemáticamente correcto.
