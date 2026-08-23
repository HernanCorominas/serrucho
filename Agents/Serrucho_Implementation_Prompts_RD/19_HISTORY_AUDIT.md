# 19 — Historial de cambios

## Prompt para Antigravity

Implementa un historial de actividad del Serrucho.

La app de Kittysplit actualmente expone un historial de cambios del Kitty.

### Registrar

- creación de gasto;
- edición;
- eliminación;
- transferencia;
- ingreso;
- settlement;
- cambio de participante;
- cambio de configuración relevante;
- adjunto agregado/eliminado;
- cambios de permisos.

### Cada evento

Debe guardar:
- actor;
- tipo;
- fecha/hora;
- entidad afectada;
- resumen legible;
- datos suficientes para auditoría.

### UX

No mostrar un log técnico incomprensible.

Ejemplos:
"Braulin agregó Cena — RD$4,200"
"Ana marcó como saldado RD$1,050 con Carlos"
"Carlos editó Gasolina de RD$2,500 a RD$2,800"

### Criterios

El historial no debe alterar balances y debe sobrevivir a ediciones posteriores.
