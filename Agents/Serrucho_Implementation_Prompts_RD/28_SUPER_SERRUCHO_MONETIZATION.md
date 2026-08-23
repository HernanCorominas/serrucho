# 28 — Modelo premium por Serrucho

## Prompt para Antigravity

Diseña una capa de funcionalidades premium inspirada en el modelo Super Kitty, pero adaptada al negocio de Serrucho.

### Principio

No convertir funciones básicas de uso diario en un paywall agresivo.

### Candidatas premium

La arquitectura debe permitir habilitar por Serrucho:
- grupos muy grandes;
- múltiples monedas;
- adjuntos;
- funciones avanzadas futuras.

### Modelo

Una sola compra puede desbloquear el Serrucho completo para todos sus participantes.

No cobrar a cada participante individualmente por usar la misma experiencia compartida.

### Arquitectura

Separar:
- feature entitlement;
- payment transaction;
- Serrucho;
- usuario comprador.

No mezclar lógica de pago con el motor de gastos.

### Contexto RD

Los precios deben estar preparados para DOP y medios de pago disponibles en el mercado objetivo, pero no hardcodear un proveedor hasta que exista una integración definida.

### Criterios

- un pago desbloquea para el grupo;
- estado verificable en backend;
- restauración de compra;
- manejo de pago fallido;
- idempotencia;
- no bloquear datos existentes por error.
