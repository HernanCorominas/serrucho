# SER-KITTY-010C-FIX: Navigation Evidence & Route Verification Audit

**Phase:** Prompt 010C-FIX (Mobile Navigation Evidence & Route Verification Pass)  
**Date:** 2026-09-07  
**Scope:** `apps/mobile`, `apps/web`, `packages/core`, `packages/ui`  
**Classification:** VERIFIED WITH DOCUMENTED LIMITATIONS  

---

## 1. Executive Summary

- **Status:** **PASS WITH CORRECTIONS**
- **Assessment:** The mobile navigation architecture implemented in 010C has been thoroughly audited and hardened with functional verification evidence.
- **Key Corrections Applied:**
  1. **Elimination of Duplicate Global Navigation:** The `apps/mobile/app/(tabs)/_layout.tsx` configuration was updated to set `tabBarStyle: { display: "none" }` and `headerShown: false`. This ensures that `(tabs)` operates strictly as a technical route container required by Expo Router, eliminating the duplicate/parallel global bottom bar ("Mis Serruchos" / "Ajustes") and leaving the Global Drawer (`GlobalDrawer`) as the sole global shell navigation owner.
  2. **Active Kitty Bottom Tabs Integration:** `ActiveKittyBottomTabs` (Gastos, Saldos, Ajustes) is mounted at the bottom of the active Kitty screen (`apps/mobile/app/serrucho/[id].tsx`), providing the 3 canonical Kittysplit bottom tabs without competing global bars.
  3. **Canonical Active Serrucho Source of Truth:** Documented and verified that `activeSerruchoId` is derived canonically from Expo Router route parameters (`useLocalSearchParams<{ id: string }>()`) in `serrucho/[id].tsx` and synchronized one-way into `GlobalNavigationContext` on mount, resetting cleanly to `null` on unmount.
  4. **Deep-Link Isolation & Stale State Elimination:** Added comprehensive automated integration tests proving that transitioning from Serrucho A $\to$ Serrucho B $\to$ Serrucho A via deep links updates the active context and drawer highlights without residual state.

---

## 2. Navigation Architecture

```
Global Application Shell (apps/mobile/app/_layout.tsx)
  │
  ├── GlobalNavigationProvider (State & Drawer Context)
  │
  ├── GlobalDrawer (Global Navigation Drawer)
  │     ├── Mi Perfil (PLACEHOLDER / NAVIGATION TARGET)
  │     ├── Iniciar nuevo Serrucho (/serrucho/create)
  │     ├── Tus Serruchos (/(tabs))
  │     ├── Importar (/import - PLACEHOLDER / NAVIGATION TARGET)
  │     ├── Feedback (WhatsApp Deep Link - SERRUCHO ADAPTATION)
  │     └── SERRUCHOS RECIENTES (Highlighted Active Kitty)
  │
  ├── Dashboard / Technical Container (apps/mobile/app/(tabs)/index.tsx)
  │     └── Header Row (Hamburger Button → openDrawer, Stats, Search, Status Tabs)
  │
  └── Active Kitty Screen (apps/mobile/app/serrucho/[id].tsx)
        │
        ├── ContextualTopAppBar (Hamburger Menu, Group Title, Share WhatsApp)
        │
        ├── Screen Content (Header Metrics, "Who are you?" Identity, Tab Body)
        │
        └── ActiveKittyBottomTabs (Gastos | Saldos | Ajustes)
```

---

## 3. Route Ownership

| Route | Screen Component | Layout / Container | Navigation Owner | State Source |
| :--- | :--- | :--- | :--- | :--- |
| `/(tabs)` | `DashboardScreen` (`(tabs)/index.tsx`) | `(tabs)/_layout.tsx` (`display: none`) | Root Stack + GlobalDrawer | `mobileStorage.getSerruchos()` |
| `/(tabs)/settings` | `SettingsScreen` (`(tabs)/settings.tsx`) | `(tabs)/_layout.tsx` (`display: none`) | Root Stack + GlobalDrawer | Local React State |
| `/serrucho/[id]` | `SerruchoDetailScreen` (`serrucho/[id].tsx`) | Root Stack (`headerShown: false`) | `ContextualTopAppBar` + `ActiveKittyBottomTabs` | Route Param `id` + `mobileStorage.getSerruchoDetail(id)` |
| `/serrucho/create` | `CreateSerruchoScreen` (`serrucho/create.tsx`) | Root Stack Modal (`presentation: modal`) | Modal Header Back / Cancel | Form State + `mobileStorage.saveSerruchos()` |
| `/serrucho/add-expense` | `AddExpenseScreen` (`serrucho/add-expense.tsx`) | Root Stack Modal (`presentation: modal`) | Modal Header Back / Cancel | Route Param `serruchoId` + Storage |
| `/profile` | `ProfileScreen` (`profile.tsx`) | Root Stack (`headerShown: false`) | In-Screen Top Bar (Back) | Local Identity Storage |
| `/import` | `ImportScreen` (`import.tsx`) | Root Stack (`headerShown: false`) | In-Screen Top Bar (Back) | Local Preview Handler |

---

## 4. Active Serrucho Source of Truth

- **Canonical Owner:** Expo Router URL / Route Parameters (`id` extracted via `useLocalSearchParams<{ id: string }>()`).
- **Storage:** Local AsyncStorage (`@serrucho:serrucho:[id]`).
- **Derivation & Global Sync:**
  - When `SerruchoDetailScreen` mounts, `useEffect` executes:
    ```tsx
    setActiveSerruchoId(id);
    setActiveSerruchoName(serrucho.name);
    registerRecent(id, serrucho.name);
    ```
  - On unmount, cleanup executes:
    ```tsx
    setActiveSerruchoId(null);
    setActiveSerruchoName(null);
    ```
- **Local Screen Deduplication:** `SerruchoDetailScreen` does NOT maintain an independent `localActiveSerruchoId` state variable. It directly uses the canonical route `id`.
- **Consumers:**
  1. `GlobalDrawer`: Consumes `activeSerruchoId` to display the purple badge `ACTIVO` next to the corresponding item in "Serruchos Recientes".
  2. `ContextualTopAppBar`: Consumes `serrucho.name` for rendering and share triggers.
  3. `ActiveKittyBottomTabs`: Renders within the active Serrucho screen context.

---

## 5. Legacy Navigation Audit

- **Does old global bottom navigation still exist?** **NO**
- **Does it create duplicate navigation?** **NO**
- **Is `(tabs)` only a technical route container?** **YES**

### Detailed Rationale
In `apps/mobile/app/(tabs)/_layout.tsx`, the tab bar style is configured with:
```tsx
tabBarStyle: {
  display: "none",
}
```
and `headerShown: false`. As a result, the tab bar is never rendered to the user on mobile, preventing any duplicate bottom bars when navigating between the Dashboard and individual Serrucho screens.

---

## 6. Deep-Link Evidence

### A. Direct Serrucho Route (`/serrucho/[id]`)
- **Evidence:** Vitest automated test `Deep Link Matrix & Route Handlers -> should correctly resolve /serrucho/[id] to Active Kitty Shell`.
- **Behavior:** Resolves `id`, loads group from storage, synchronizes `activeSerruchoId`, renders `ContextualTopAppBar` and `ActiveKittyBottomTabs`.
- **Result:** **PASS**

### B. Share Link (`/s/[token]`)
- **Evidence:** Web route `apps/web/app/s/[token]/page.tsx` and Vitest test suite `tests/unit/share.test.ts`.
- **Behavior:** Token resolves to group ID without requiring prior authentication, preserves Guest mode, and isolates local identity.
- **Result:** **PASS**

### C. Read-Only Route (`/r/[token]`)
- **Evidence:** Web route `apps/web/app/r/[token]/page.tsx` and Vitest test suite `tests/unit/read-only.test.ts`.
- **Behavior:** Read-only mode disallows mutation actions (adding expenses, deleting expenses, changing settings, settling debts) while allowing read access to Gastos, Saldos, and Ajustes.
- **Result:** **PASS**

### D. Join Route (`/join/[token]`)
- **Evidence:** Web route `apps/web/app/join/[token]/page.tsx` and Vitest test suite `tests/unit/ser-kitty-005-participants-identity-share.test.ts`.
- **Behavior:** Resolves invite token, presents participant selection or addition modal, does not leak stale `activeSerruchoId`.
- **Result:** **PASS**

---

## 7. Guest Mode

- **Storage Key Convention:** `@serrucho:my_id:${serruchoId}`
- **Evidence:** Vitest automated test `Guest Mode & Per-Serrucho Identity Isolation`.
- **Isolation:** A participant selected as "Tú eres" in Serrucho 1 does not overwrite or bleed into Serrucho 2.
- **Manual Identity Switch:** The user can tap "Cambiar" in the "Who are you?" banner to choose a different participant at any time.

---

## 8. Read-Only Protection

- When accessed via `/r/[token]`, permissions evaluate to `readOnly: true`.
- Financial mutation actions (add expense, edit expense, delete expense, register settlement transfer) return forbidden or throw authorization error.
- UI elements for mutation are hidden or disabled.

---

## 9. Closed Groups

- **State:** `status: "CLOSED"` with `closed_at` timestamp.
- **Evidence:** Vitest automated test `Closed Group Invariants`.
- **Behavior:** Viewing Gastos, Saldos, and Ajustes remains fully functional. Adding new expenses or participants is blocked. Reopening requires explicit confirmation.

---

## 10. Android Back Navigation

- **Hardware Back Hierarchy:**
  1. **Drawer Open:** `GlobalDrawer` registers `BackHandler.addEventListener("hardwareBackPress")` which closes the drawer and returns `true`.
  2. **Modal Open:** In-screen modals (Add Participant, Edit Settings, Identity) close on back press.
  3. **Active Serrucho Screen:** Pressing back or the Top Bar back action returns to `/(tabs)` (Dashboard).
  4. **Dashboard:** Default Expo Router behavior.

---

## 11. Drawer Functional Preservation

| Item | Route / Action | Functional Status | Classification |
| :--- | :--- | :--- | :--- |
| **Mi Perfil** | `/profile` | Screen renders local user identity and app info | `PLACEHOLDER / NAVIGATION TARGET` |
| **Iniciar nuevo Serrucho** | `/serrucho/create` | Full creation modal with form validation & local storage | `PARITY IMPLEMENTED` |
| **Tus Serruchos** | `/(tabs)` | Navigates to main Dashboard screen with recents & search | `PARITY IMPLEMENTED` |
| **Importar** | `/import` | Screen provides Splitwise & JSON import targets with alerts | `PLACEHOLDER / NAVIGATION TARGET` |
| **Feedback** | `https://wa.me/?text=...` | Direct WhatsApp deep link with prefilled Dominican text | `SERRUCHO ADAPTATION` |
| **Recientes** | `/serrucho/[id]` | List loaded from `@serrucho:recents`, active group badged | `PARITY IMPLEMENTED` |

---

## 12. Bottom Tabs

- **Active Kitty Tabs:** Exactly 3 canonical tabs:
  1. **Gastos** (`expenses`): List of expenses, quick stats, add expense FAB/top action.
  2. **Saldos** (`balances`): Participant net balance breakdowns, debt simplification matrix (`simplifyDebts`), settle transfer triggers.
  3. **Ajustes** (`settings`): Participant roster, invite links, export summary, close/delete group.
- **Global Tabs:** Legacy visible global tabs disabled (`display: "none"`).

---

## 13. Navigation Matrix

| Entry Point | Expected Destination | Active Serrucho | Guest | Read-only | Closed | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/serrucho/[id]` | Kitty Shell | Correct (`id`) | Yes | Permitted | Permitted | **PASS** |
| `/s/[token]` | Kitty Shell | Correct (resolved) | Yes | No | Permitted | **PASS** |
| `/r/[token]` | Read-only Kitty | Correct (resolved) | Yes | Yes (enforced) | Permitted | **PASS** |
| `/join/[token]` | Join flow | Correct (target) | Yes | N/A | Permitted | **PASS** |
| Drawer → Tus Serruchos | Dashboard (`/(tabs)`) | None (`null`) | Yes | N/A | N/A | **PASS** |
| Drawer → Iniciar nuevo Serrucho | Create Modal | New group | Yes | N/A | N/A | **PASS** |
| Drawer → Mi Perfil | Profile Screen | Preserved | Yes | N/A | N/A | **PASS** |
| Drawer → Importar | Import Screen | Preserved | Yes | N/A | N/A | **PASS** |
| Drawer → Feedback | WhatsApp Deep Link | Preserved | Yes | N/A | N/A | **PASS** |

---

## 14. Test Evidence

| Criterion | Evidence Type | Evidence Location | Result |
| :--- | :--- | :--- | :--- |
| Single Source of Truth (`activeSerruchoId`) | Unit / Integration | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 1) | **PASS** |
| Deep-Link Isolation (A $\to$ B $\to$ A) | Integration | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 1) | **PASS** |
| Technical Route Container `(tabs)` | Static & Unit | `apps/mobile/app/(tabs)/_layout.tsx` & test file (Section 2) | **PASS** |
| Deep-Link Matrix Resolution | Unit | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 3) | **PASS** |
| Guest Mode Identity Isolation | Integration | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 4) | **PASS** |
| Closed Group Mutation Guard | Integration | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 5) | **PASS** |
| Android Back Button Order | Unit | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 6) | **PASS** |
| Drawer Item Classification | Unit | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 7) | **PASS** |
| Bottom Tabs Integrity (Gastos/Saldos/Ajustes) | Unit | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 8) | **PASS** |
| BAL-08 Deterministic Tie-Break (Juan=3334, Maria=3333, Pedro=3333) | Unit | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 9) | **PASS** |
| Financial Zero-Sum & Debt Engine Invariants | Unit | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 9) | **PASS** |
| Itemized Split Zero Runtime References | Static & Unit | `apps/web/tests/unit/ser-kitty-010c-mobile-navigation.test.ts` (Section 9) | **PASS** |

---

## 15. Limitations & Caveats

1. **Performance Claims:** Animated drawer transitions use React Native `Animated.timing` with `useNativeDriver: true` for 60 FPS target. However, 60 FPS has **not been independently benchmarked** via automated FPS profiler.
2. **Profile & Import Classification:** `ProfileScreen` (`/profile`) and `ImportScreen` (`/import`) are currently functional navigation destinations serving as **PLACEHOLDER / NAVIGATION TARGET**, pending full backend sync features in subsequent prompts.
3. **Native Runtime Testing:** Tests execute in Vitest Node/JSDOM simulation. Native gesture-driven drawer panning and physical device hardware back buttons were verified by architecture audit and synthetic event tests.
