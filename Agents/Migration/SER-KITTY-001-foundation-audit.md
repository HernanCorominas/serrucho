# 🪚 SERRUCHO — Audit Report: Foundation + Product Shell (SER-KITTY-001)

## A. Estado Actual del Sistema

El monorepo actual de Serrucho está compuesto por:
* `apps/web`: Aplicación Web en Next.js 15 (App Router), Tailwind CSS y React 19.
* `apps/mobile`: Aplicación Móvil en Expo SDK 52 / React Native 0.76 (Metro Bundler).
* `packages/core`: Motor financiero canónico en TypeScript estricto con representación en centavos enteros (`math.ts`), validaciones Zod y tipos de dominio compartidos.
* `packages/ui`: Componentes base UI compartidos.
* `packages/supabase`: Cliente y tipos de integración para base de datos PostgreSQL en Supabase.
* `packages/config`: Configuraciones centralizadas de TypeScript, ESLint y Tailwind.

---

## B. Qué Coincide con Kittysplit (`ALREADY_MATCHES`)

1. **Diseño Visual y Paleta de Tokens**:
   * Teal oficial de Kittysplit (`#00a896`, `#028090`, `#e6f6f4`) y acento Coral (`#f26419`).
   * Fondos limpios y claros `#f8fafc`, tarjetas blancas redondeadas (`radius-xl`), tipografía moderna de alto contraste.
   * `[OBSERVED]` en `apps/web/lib/brand-config.ts`, `apps/web/app/globals.css` y `apps/mobile/src/theme/colors.ts`.

2. **Estructura Canónica de 3 Pestañas (Group Workspace Shell)**:
   * Pestaña 1: **Gastos** (lista cronológica, total gastado, botón destacado `+ Añadir Gasto`).
   * Pestaña 2: **Saldos** (Quién paga a quién con menor número de transferencias y balances netos).
   * Pestaña 3: **Ajustes** (Administración de participantes, moneda, exportación y borrado).
   * `[OBSERVED]` en `apps/web/app/dashboard/[id]/page.tsx` y `apps/mobile/app/serrucho/[id].tsx`.

3. **Modo Invitado sin Registro Obligatorio (Guest Mode)**:
   * Acceso total por enlace único directo (`/k/[id]`), almacenamiento de recientes en `localStorage` / `AsyncStorage`.
   * `[OBSERVED]` en `apps/web/app/k/[id]/page.tsx` y `apps/mobile/src/services/storage.ts`.

4. **Motor Financiero Canónico de Centavos Enteros**:
   * Algoritmo voraz de simplificación de deudas (*Min-Cash-Flow Greedy Debt Simplification* / `simplifyDebts`).
   * División por partes iguales (`splitEqually`), por cuotas/shares (`splitByShares`) y montos exactos (`splitByExactAmounts`).
   * `[OBSERVED]` en `packages/core/src/finance/math.ts` (100% de tests pasando en `tests/unit/math.test.ts`).

5. **Adaptación Dominicana (DOP/RD$ + WhatsApp)**:
   * Moneda predeterminada `RD$`, deep links cordiales de cobro e invitación para WhatsApp y soporte para cuentas bancarias dominicanas (Popular, BHD, Banreservas, tPago).
   * `[OBSERVED]` en `packages/core/src/finance/share.ts` y componentes de cobro.

---

## C. Qué Necesita Modificación (`MODIFY`)

1. **Selector de Identidad Móvil ("¿Quién eres tú?")**:
   * `[MODIFY]` Eliminar cualquier asunción de autoidentificación del creador en mobile. Mostrar el selector explícito al entrar a un Serrucho para elegir qué participante eres en este dispositivo y recordar la selección localmente.
2. **Métodos de Reparto en Formulario de Gastos**:
   * `[MODIFY]` Asegurar que solo se expongan los 3 métodos canónicos de Kittysplit: **Equal**, **Shares**, **Fixed Amount**.
3. **Shell de Autenticación / Login**:
   * `[MODIFY]` Mantener la entrada limpia "Iniciar Sesión / Acceder a mis Serruchos" vía Enlace Mágico por email y Google OAuth, sin contraseñas tradicionales ni fricción.

---

## D. Qué Debe Eliminarse (`DELETE`)

1. **Itemized Split (División Plato por Plato)**:
   * `[DELETE]` Eliminado completamente de la UI y flujos de gasto. La división se efectúa exclusivamente mediante los 3 métodos canónicos.
2. **Calculadora Aislada fuera de Grupos (`/calculadora`)**:
   * `[DELETE]` No existe calculadora independiente en Kittysplit.
3. **Premios del Coro / Coro Awards (`coro-awards-card.tsx`)**:
   * `[DELETE]` Gamificación ajena a la simplicidad del producto Kittysplit.
4. **Generador de Story de Instagram (`shareable-story-dialog.tsx`)**:
   * `[DELETE]` El canal oficial es WhatsApp y enlaces web directos.
5. **Wizard Destructivo de Cierre Congelado (`close-serrucho-wizard.tsx`)**:
   * `[DELETE]` En Kittysplit las deudas se liquidan de forma viva continua agregando pagos en cualquier momento.

---

## E. Qué No Debe Tocarse Todavía (`DEFERRED`)

1. **Módulo Completo de Gastos Avanzado (Prompt 07 - 11)**:
   * `[DEFERRED]` Edición profunda, reglas avanzadas de splits y validaciones complejas.
2. **Módulo de Liquidación y Pagos Avanzado (Prompt 13 - 16)**:
   * `[DEFERRED]` Pasarelas reales o flujos de pago externos (Super Serrucho permanece en modo conceptual/simulado).
3. **Módulo de Gestión Completa de Cuentas Multi-dispositivo (Prompt 25)**:
   * `[DEFERRED]` Sincronización avanzada de perfiles en la nube.
4. **Importación desde Splitwise (Prompt 29)**:
   * `[DEFERRED]` Parser de CSV externo.

---

## F. Incertidumbres / Resoluciones Definitivas (`UNKNOWN`)

* **Super Serrucho**: Decisión tomada ➔ UX y feature set modelados conceptualmente con checkout simulado ($0 costo, sin Stripe ni pasarelas externas en esta fase).
* **Itemized Split**: Decisión tomada ➔ Eliminado al 100%. Solo se admiten los 3 métodos canónicos (Equal, Shares, Fixed Amount).
* **Identidad Móvil**: Decisión tomada ➔ Selector explícito "¿Quién eres tú?" sin auto-asignar al creador como "You".
