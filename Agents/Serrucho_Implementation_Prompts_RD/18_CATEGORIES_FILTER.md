# 18 — Categorías y filtro de gastos

## Prompt para Antigravity

Implementa categorías de gastos e ingresos.

Kittysplit añadió esta función en 2026 y permite asignar categorías y filtrar la lista.

### Categorías base adaptadas a RD

Crear una taxonomía inicial útil para Serrucho:

1. Vivienda y alquiler
2. Alojamiento
3. Supermercado y comida
4. Restaurantes y delivery
5. Transporte
6. Gasolina
7. Servicios del hogar
8. Internet y telefonía
9. Salud
10. Entretenimiento
11. Compras
12. Cuidado personal
13. Comisiones y cargos
14. Regalos
15. Viajes
16. Otros

### Reglas

- categoría opcional o configurable;
- cada movimiento puede tener una categoría;
- filtros por categoría;
- filtros combinables con fecha y participante si ya existen en Serrucho;
- categorías no deben cambiar balances.

### UX

Usar icono/color consistente para facilitar escaneo.

### Criterios

Poder responder rápidamente:
"¿Cuánto gastamos en comida?"
"¿Cuánto fue gasolina?"
"¿Cuánto gastamos en el viaje?"
