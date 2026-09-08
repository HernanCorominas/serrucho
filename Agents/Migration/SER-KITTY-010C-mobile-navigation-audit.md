# SERRUCHO — PROMPT 010C AUDIT: MOBILE NAVIGATION SHELL & GLOBAL DRAWER

**Document ID:** `SER-KITTY-010C-mobile-navigation-audit`  
**Binding Golden Specification:** `Agents/Migration/SER-KITTY-010A.1-golden-reference-correction.md`  
**Previous Verification:** `Agents/Verification/SER-KITTY-010B-design-system-verification.md`  
**Execution Mode:** Controlled Critical Mobile Navigation Implementation  
**Date:** 2026-09-07  

---

## 1. Navigation Before
- **Root Layout (`app/_layout.tsx`)**: Root Stack navigator con cabecera verde esmeralda (`colors.primary`), sin soporte de drawer lateral global.
- **Root Bottom Tabs (`app/(tabs)/_layout.tsx`)**: Tabs principales a nivel de aplicación con solo dos pantallas (`Mis Serruchos` y `Ajustes`).
- **Serrucho Detail (`app/serrucho/[id].tsx`)**: Pantalla individual con un header visual custom teal, tabs segmentadas inline y sin conexión con un menú global ni contexto de cambio rápido.
- **Flujo de Navegación**: Entrar a un Serrucho requería regresar manualmente a la lista principal; no existía acceso directo a otras acciones globales como "Iniciar nuevo Serrucho", "Importar" o "Serruchos Recientes".

---

## 2. Navigation After
- **Global Application Shell**: Estructura unificada donde el menú lateral (**Global Navigation Drawer**) coexiste con la vista activa.
- **Global Navigation Drawer**:
  - Slide-out lateral desde la izquierda ($\sim 80\%$ viewport responsive, clamp 280–340px) con animación fluida nativa $60\text{fps}$.
  - Backdrop dimming overlay ($\sim 60\%$ opacidad) que cierra el drawer al tocarlo.
  - Intercepción de botón Back en Android: cierra el Drawer primero antes de alterar el stack de pantallas.
  - Profile Header con avatar circular, display name y estado local/invitado (tap $\to$ `/profile`).
  - Acciones globales: "Iniciar nuevo Serrucho" (`/serrucho/create`), "Tus Serruchos" (`/(tabs)`), "Importar" (`/import`), "Feedback" (WhatsApp).
  - Sección "SERRUCHOS RECIENTES" con highlight visual (`DSBadge` "ACTIVO" en púrpura) para el Serrucho actual y cambio rápido entre grupos.
- **Contextual Kitty Top App Bar**:
  - Icono Hamburguesa ($\ge 44 \times 44\text{px}$) para abrir el Drawer.
  - Título con el nombre del Serrucho activo (truncamiento en una sola línea `numberOfLines={1}`).
  - Botón de Compartir ($\ge 44 \times 44\text{px}$) reutilizando el flujo nativo / WhatsApp.
  - Superficie oscura con hairline de 1px y padding seguro de barra de estado.
- **Active Kitty Bottom Tabs**:
  - Tres pestañas canónicas del Serrucho:
    1. **Gastos (`expenses`)**: Icono `receipt`, badge con contador de gastos.
    2. **Saldos (`balances`)**: Icono `scale`.
    3. **Ajustes (`settings`)**: Icono `settings`.
  - Pestaña activa resaltada con acento Purple/Lilac (`#8B5CF6`) e indicador superior de píldora.
  - Pestañas inactivas en gris pizarra (`#94A3B8`).

---

## 3. Existing Route Map

| Route | Entry Point | Screen | Params | Guest Mode | Read-Only | Deep Link |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `/(tabs)` | App launch | `DashboardScreen` | None | Supported | N/A | Supported |
| `/(tabs)/settings` | Tab 2 | `SettingsScreen` | None | Supported | N/A | Supported |
| `/serrucho/[id]` | Dashboard / Recents | `SerruchoDetailScreen` | `id: string` | Supported | Supported | `/serrucho/[id]`, `/s/[token]` |
| `/serrucho/create` | Dashboard CTA | `CreateSerruchoScreen` | None | Supported | N/A | Supported |
| `/serrucho/add-expense`| Detail CTA | `AddExpenseScreen` | `id: string` | Supported | Guarded | Supported |

---

## 4. Target Route Map

| Route | Entry Point | Screen | Params | Guest Mode | Read-Only | Deep Link | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `/(tabs)` | App launch / Drawer "Tus Serruchos" | `DashboardScreen` | None | Supported | N/A | Supported | **Preserved + Hamburger** |
| `/(tabs)/settings` | Legacy tab | `SettingsScreen` | None | Supported | N/A | Supported | **Preserved** |
| `/serrucho/[id]` | Dashboard / Recents / Deep links | `SerruchoDetailScreen` | `id: string` | Supported | Supported | `serrucho://`, `/s/`, `/r/`, `/join/` | **Top Bar + Bottom Tabs + Drawer Context** |
| `/serrucho/create` | Drawer / Dashboard CTA | `CreateSerruchoScreen` | None | Supported | N/A | Supported | **Preserved** |
| `/serrucho/add-expense`| Expenses tab CTA | `AddExpenseScreen` | `id: string` | Supported | Guarded | Supported | **Preserved** |
| `/profile` | Drawer Header | `ProfileScreen` | None | Supported | N/A | Supported | **NEW Clean Placeholder** |
| `/import` | Drawer "Importar" | `ImportScreen` | None | Supported | N/A | Supported | **NEW Clean Placeholder** |

---

## 5. Drawer Architecture
- `apps/mobile/src/components/navigation/GlobalDrawer.tsx`
- Montado en el nivel raíz dentro de `_layout.tsx`, por encima del `Stack` de Expo Router.
- Controlado por `GlobalNavigationContext` (`isDrawerOpen`, `openDrawer`, `closeDrawer`, `toggleDrawer`).
- Animación pura con `Animated.Value` y `useNativeDriver: true`.

---

## 6. Top App Bar Architecture
- `apps/mobile/src/components/navigation/ContextualTopAppBar.tsx`
- Renderizado directamente en `serrucho/[id].tsx` cuando un Serrucho está activo.
- Consume `openDrawer()` de `GlobalNavigationContext` y `handleShareSerrucho()` existente.

---

## 7. Bottom Tab Architecture
- `apps/mobile/src/components/navigation/ActiveKittyBottomTabs.tsx`
- Renderizado al pie de `serrucho/[id].tsx` con padding dinámico `useSafeAreaInsets().bottom`.
- Conmuta entre `expenses`, `balances` y `settings` sin desmontar la pantalla ni perder estado o identidad.

---

## 8. State Ownership
- **Global Navigation State**: `isDrawerOpen`, `activeSerruchoId`, `activeSerruchoName`, `recents` administrados por `GlobalNavigationProvider`.
- **Kitty Contextual State**: Pestaña activa (`expenses` / `balances` / `settings`), identidad personal (`myParticipantId`), gastos y saldos conservados en `SerruchoDetailScreen`.

---

## 9. Deep-Link Preservation
- Las rutas `/serrucho/[id]`, `/s/[token]`, `/r/[token]`, `/join/[token]` continúan resolviendo directamente hacia la vista contextual del Serrucho.
- El Drawer sincroniza automáticamente el `activeSerruchoId` al cargarse un Serrucho desde cualquier deep link.

---

## 10. Guest Mode Preservation
- El Drawer no asume cuentas ni correos inexistentes para usuarios invitados.
- En el header del Drawer y en `/profile` se indica claramente "Modo Local / Invitado 🇩🇴".
- La persistencia de identidad por grupo en `AsyncStorage` (`@serrucho:my_id:[serruchoId]`) se mantiene intacta.

---

## 11. Read-Only Preservation
- Los tokens de solo lectura (`read_only_token`) continúan aplicando las protecciones existentes: la nueva navegación no otorga permisos de mutación ni acciones destructivas no autorizadas.

---

## 12. Closed Group Preservation
- Si un Serrucho tiene estado `CLOSED`, las restricciones de edición se mantienen completamente activas. La navegación permite consultar gastos y saldos históricos.

---

## 13. Back Behavior
- **Prioridad 1**: Si el Drawer está abierto $\to$ `BackHandler` cierra el Drawer sin salir de la pantalla.
- **Prioridad 2**: Si un modal está abierto $\to$ cierra el modal.
- **Prioridad 3**: Si está en el Serrucho activo $\to$ vuelve al Dashboard principal `/(tabs)`.

---

## 14. Safe Area Behavior
- `useSafeAreaInsets().top` utilizado en `GlobalDrawer`, `ContextualTopAppBar`, `ProfileScreen` e `ImportScreen`.
- `useSafeAreaInsets().bottom` utilizado en `GlobalDrawer` y `ActiveKittyBottomTabs`.
- Cero offsets fijos por dispositivo.

---

## 15. Responsive Behavior
- Ancho del Drawer: `Math.min(Math.max(windowWidth * 0.8, 280), 340)`.
- Truncamiento tipográfico en una sola línea en encabezados (`numberOfLines={1}`).

---

## 16. Design System Primitives Reused
- `DSText` (variantes title, section, bodyMedium, caption)
- `DSAvatar` (tamaños sm, md, lg con iniciales automáticas)
- `DSDivider` (hairlines de 1px)
- `DSSettingRow` (filas de navegación continua $\ge 48\text{px}$)
- `DSIconButton` (botones táctiles $\ge 44 \times 44\text{px}$)
- `DSSection` (encabezados de sección)
- `DSBadge` (badge "ACTIVO" en púrpura)
- `DSButton` (botones primarios y secundarios)

---

## 17. Files Changed
- `apps/mobile/app/_layout.tsx` (Proveedor global y drawer raíz)
- `apps/mobile/app/(tabs)/index.tsx` (Botón Hamburguesa en cabecera)
- `apps/mobile/app/serrucho/[id].tsx` (Contextual Top Bar + Bottom Tabs + sync contexto)

---

## 18. Files Created
- `apps/mobile/src/navigation/GlobalNavigationContext.tsx`
- `apps/mobile/src/navigation/index.ts`
- `apps/mobile/src/components/navigation/GlobalDrawer.tsx`
- `apps/mobile/src/components/navigation/ContextualTopAppBar.tsx`
- `apps/mobile/src/components/navigation/ActiveKittyBottomTabs.tsx`
- `apps/mobile/src/components/navigation/index.ts`
- `apps/mobile/app/profile.tsx`
- `apps/mobile/app/import.tsx`
- `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts`
- `Agents/Migration/SER-KITTY-010C-mobile-navigation-audit.md`
- `Agents/Verification/SER-KITTY-010C-mobile-navigation-verification.md`

---

## 19. Files Intentionally Unchanged
- `packages/core/src/finance/*` (Motor financiero: `math.ts`, `currency.ts`, `receipt-parser.ts`, `share.ts`)
- `packages/core/src/types/*` (Tipos de dominio)
- `apps/web/src/app/*` (Rutas y vistas de la aplicación Web)
- `apps/mobile/src/screens/*` (Lógica de negocio y cálculo financiero intacto)

---

## 20. Risks & Mitigation
- **Riesgo**: Colisión de gestos entre ScrollView y Drawer.
- **Mitigación**: Drawer montado con `pointerEvents` condicional y Backdrop táctil explícito.

---

## 21. Known Limitations
- El rediseño visual de las listas de Gastos y Balances no pertenece a este prompt (corresponde a 010D y 010E).
- Las ilustraciones de estados vacíos se integrarán en 010G.
- El perfil visual extendido se detallará en 010F.

---

## 22. Test Matrix
- **Suites antes**: 43 suites / 412 tests
- **Suites agregadas**: 1 suite (`tests/unit/ser-kitty-010c-mobile-navigation.test.ts`) / 14 tests
- **Resultado final**: 44 suites / 426 tests — **100% PASS**

---

## 23. Decision Gate
**Decision:** `A — READY FOR 010D`  
La arquitectura de navegación móvil (Global Drawer + Contextual Top App Bar + Active Kitty Bottom Tabs) ha sido completada, testeada y validada en su totalidad con cero regresiones. Se mantiene el **ABSOLUTE STOP** a la espera de confirmación humana para iniciar el Prompt 010D.
