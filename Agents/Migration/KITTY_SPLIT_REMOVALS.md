# 🪚 SERRUCHO — Kittysplit Migration Removals Inventory

Este documento cataloga todos los elementos, archivos, componentes, tipos y pruebas que **NO forman parte del producto de referencia (Kittysplit)** y que deben eliminarse de forma coherente y completa de extremo a extremo en la fase correspondiente.

> [!IMPORTANT]
> **REGLA DE FASE 0:** No se ha eliminado ningún archivo todavía. Esta lista constituye el inventario de auditoría para aprobación previa antes de proceder a la Fase B de eliminación.

---

## 1. Funcionalidades a Eliminar

### A. Calculadora Independiente (`/calculadora`)
* **Motivo:** En Kittysplit no existe una calculadora aislada de ITBIS/Propina fuera de un grupo. El flujo de división ocurre siempre dentro de un Kitty.
* **Archivos y Componentes Web a Eliminar:**
  * `apps/web/app/calculadora/page.tsx`
  * `apps/web/features/calculator/` (todo el directorio: `components/quick-split-calculator.tsx`, `components/itemized-bill-splitter.tsx`, etc.)
  * Enlaces a `/calculadora` en `apps/web/app/page.tsx` y layouts.
* **Archivos Mobile a Eliminar:**
  * `apps/mobile/app/(tabs)/calculator.tsx`
  * Icono / Tab de Calculadora en `apps/mobile/app/(tabs)/_layout.tsx`

---

### B. Premios del Coro / Coro Awards (`/awards`)
* **Motivo:** Gamificación no existente en Kittysplit que añade ruido y complejidad ajena a la simplicidad del producto.
* **Archivos y Componentes Web a Eliminar:**
  * `apps/web/features/settlements/components/coro-awards-card.tsx`
* **Archivos Mobile a Eliminar:**
  * `apps/mobile/app/(tabs)/awards.tsx`
  * Icono / Tab de Premios en `apps/mobile/app/(tabs)/_layout.tsx`
* **Dominio / Tipos a Limpiar:**
  * `CoroAward` en `packages/core/src/types/domain.ts` y `apps/web/lib/types/domain.ts`
  * Generador de premios en `features/settlements/service.ts`

---

### C. Generador de Story para Redes Sociales (`shareable-story-dialog`)
* **Motivo:** Feature externa para generar imágenes de Instagram stories que no existe en Kittysplit. El mecanismo nativo y oficial de compartir es WhatsApp y enlaces web directos.
* **Archivos Web a Eliminar:**
  * `apps/web/features/settlements/components/shareable-story-dialog.tsx`

---

### D. Asistente de Cierre Forzado / Bloqueo Inmutable (`close-serrucho-wizard`)
* **Motivo:** En Kittysplit un grupo nunca se bloquea en modo inmutable permanente con asistente destructivo ("Wizard de cierre"). Las deudas se liquidan de forma viva agregando pagos/transferencias en cualquier momento.
* **Archivos Web a Reemplazar/Eliminar:**
  * `apps/web/features/settlements/components/close-serrucho-wizard.tsx`
  * `apps/web/features/settlements/components/closed-settlement-view.tsx`
* **Archivos Mobile a Reemplazar/Eliminar:**
  * `apps/mobile/app/serrucho/close.tsx`

---

## 2. Inventario de Eliminación por Capas

```text
Capas Afectadas:
├── UI / Frontend Web
│   ├── apps/web/app/calculadora/page.tsx [DELETE]
│   ├── apps/web/features/calculator/* [DELETE]
│   ├── apps/web/features/settlements/components/coro-awards-card.tsx [DELETE]
│   ├── apps/web/features/settlements/components/shareable-story-dialog.tsx [DELETE]
│   └── Banners invasivos de "Descarga la app" [DELETE]
│
├── Mobile (Expo)
│   ├── apps/mobile/app/(tabs)/calculator.tsx [DELETE]
│   ├── apps/mobile/app/(tabs)/awards.tsx [DELETE]
│   └── apps/mobile/app/serrucho/close.tsx [DELETE / REEMPLAZAR POR SALDAR]
│
├── Domain (@serrucho/core)
│   └── Limpieza de tipos de CoroAward y generadores no utilizados
│
└── Pruebas Automatizadas
    └── Actualización de tests que referencien exclusivamente la calculadora aislada o los premios
```

---

## 3. Verificación de Integridad tras Eliminación
Cuando se ejecute la Fase B:
1. `npm run typecheck` debe mantenerse en **0 errores**.
2. `npm test` debe ejecutarse con 100% de pruebas pasando (actualizando los tests de regresión para cubrir el modelo Kittysplit).
3. No deben quedar importaciones huérfanas ni referencias muertas en el bundle.
