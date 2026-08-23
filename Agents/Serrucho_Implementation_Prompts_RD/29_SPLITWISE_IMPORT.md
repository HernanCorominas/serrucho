# 29 — Importación de datos desde otras apps

## Prompt para Antigravity

Implementa una arquitectura de importación de datos externos, tomando como referencia la importación CSV de Splitwise que Kittysplit ofrece actualmente.

### Primera versión

Permitir importar un CSV compatible con un formato definido por Serrucho.

### Flujo

1. seleccionar archivo;
2. validar;
3. mostrar preview;
4. detectar participantes;
5. detectar movimientos;
6. mostrar errores;
7. permitir correcciones;
8. confirmar;
9. crear Serrucho únicamente después de confirmación.

### Regla crítica

Nunca crear datos parcialmente durante el preview.

### Arquitectura

Crear un pipeline:
Import → Parse → Normalize → Validate → Preview → Confirm → Persist.

### Criterios

Un archivo corrupto o incompatible no debe crear datos inconsistentes.

Diseñar el importador extensible para futuros formatos.
