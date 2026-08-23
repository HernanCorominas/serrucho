# 23 — Acceso de solo lectura

## Prompt para Antigravity

Implementa un enlace de solo lectura inspirado en Super Kitty.

### Objetivo

Permitir compartir un Serrucho con alguien que puede consultar información pero no modificarla.

### Puede

- ver overview;
- ver gastos;
- ver balances;
- ver settlements;
- ver categorías;
- ver historial según política.

### No puede

- crear;
- editar;
- eliminar;
- modificar participantes;
- marcar como saldado;
- cambiar configuración.

### Seguridad

No depender únicamente de ocultar botones.

El backend/API debe verificar permisos.

### Casos

- compartir con un padre;
- compartir con un organizador;
- enviar resumen a alguien;
- presentar cierre de un viaje.

### Criterios

Intentar modificar datos usando API directamente debe ser rechazado.
