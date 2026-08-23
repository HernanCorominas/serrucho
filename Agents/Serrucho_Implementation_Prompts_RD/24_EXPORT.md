# 24 — Exportación de datos

## Prompt para Antigravity

Implementa exportación de un Serrucho a spreadsheet.

Kittysplit permite exportar gastos, cálculos y balances finales.

### Serrucho

Exportar como XLSX y, si ya existe infraestructura, CSV.

### Contenido

Hoja 1: Resumen
- Serrucho;
- fecha;
- moneda;
- total;
- balances.

Hoja 2: Movimientos
- fecha;
- descripción;
- tipo;
- pagador;
- participantes;
- monto;
- moneda;
- equivalente;
- categoría.

Hoja 3: Settlement
- deudor;
- acreedor;
- monto;
- estado.

Hoja 4: Historial, si aplica.

### Reglas

- exportación no modifica datos;
- respetar permisos;
- formatear moneda;
- fechas consistentes;
- nombres legibles.

### Criterios

Abrir el XLSX en Excel y verificar que todas las cifras coincidan con la app.
