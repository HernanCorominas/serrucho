# 27 — Paridad web, Android e iOS / experiencia responsive

## Prompt para Antigravity

Asegura que Serrucho pueda utilizarse desde navegador móvil y desktop y que la experiencia sea consistente con una futura app móvil.

Kittysplit mantiene la web y apps con paridad funcional.

### Prioridades

Mobile-first para:
- overview;
- agregar gasto;
- seleccionar participantes;
- compartir;
- revisar deudas;
- marcar settlement;
- ver comprobantes.

Desktop:
- aprovechar espacio para resumen;
- tablas cuando sean útiles;
- no cambiar reglas de negocio.

### Reglas

No duplicar lógica financiera entre plataformas.

La lógica de negocio debe vivir en servicios reutilizables/backend según la arquitectura existente.

### Criterios

Probar:
- Android Chrome;
- iPhone Safari;
- desktop Chrome;
- desktop Edge.

No debe existir una feature crítica disponible únicamente porque el usuario está en desktop.
