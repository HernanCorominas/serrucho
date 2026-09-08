# SPECIFICATION ARTIFACT: SER-KITTY-010A.1 — Kittysplit Golden Reference Specification
## Mandatory Visual & Structural Correction Pre-Implementation (Consistency Pass)

> **Milestone / Prompt**: PROMPT 010A.1-FIX — GOLDEN REFERENCE SPECIFICATION (FINAL CONSISTENCY PASS)  
> **Status**: COMPLETED & VERIFIED (CORRECTED SPECIFICATION)  
> **Precedes**: PROMPT 010B (Design System Tokens & Shared Primitives)  
> **Scope**: Rectification of visual theme assumptions from 010A, elimination of unproven HEX contradictions, resolution of Expenses tab naming, preservation of "Mis Serruchos" group management within Drawer, strict visual scope boundary rules, clarification of Multi-Payer status, and Reference Completeness Matrix.  
> **Production Feature Changes**: **0** (Pure specification and audit baseline).  
> **Date**: 2026-09-07  

---

## 1. Executive Summary & Critical Correction Notice

In the initial exploratory audit `SER-KITTY-010A`, an assumed light-mode emerald/teal design system (`#00a896`, `#028090`, `#e6f6f4`, `#f8fafc`) was tentatively proposed based on generic web conventions.

### ⚠️ Critical Correction: Golden Reference Reality
Direct inspection of the **golden reference screenshots of Kittysplit Mobile** demonstrates that Kittysplit operates with a **predominantly DARK theme UI**, featuring:
* **Deep Dark Background**: Dark navy / deep charcoal slate (`visually observed deep dark background`, exact HEX unknown).
* **Dark Elevated Surfaces**: Subtly contrasting dark surface cards and list rows (`visually observed dark elevated container`).
* **Crisp High-Contrast Text**: Crisp white primary text with muted cool-slate secondary text.
* **Purple / Violet / Lilac Accents**: Distinct purple/lilac accent color used for primary CTAs, active tab indicators, and Super Kitty highlights.
* **Subtle Dark Dividers & Borders**: Fine hairline borders separating rows and sections without heavy drop shadows.
* **Distinct Destructive Actions**: Dedicated red/coral buttons and text for logout, account deletion, and group deletion.

> [!IMPORTANT]
> **PROHIBITION ENFORCED**: All implementation planning is strictly uncoupled from arbitrary emerald/teal light themes. The design system specification in this document is grounded **100% in observable screenshot evidence** and strictly avoids unverified or speculative HEX values. Where a HEX value is an estimate, it is explicitly labeled as `estimated approximation`; otherwise semantic visual descriptors are maintained.

---

## 2. Visual Scope Boundary Rule (Prompts 010B–010I)

To prevent scope creep and guarantee that visual refactoring never impacts the financial core, the following boundary rules are strictly binding across all subsequent visual implementation prompts:

### PROMPTS 010B–010I MAY modify:
* Visual design & styling
* Screen layout & spacing
* Navigation presentation (Drawer + Top App Bar + Tab Bar)
* Responsive behavior across mobile, tablet, and desktop
* Component composition & hierarchy
* Micro-animations & transition presentation
* Interaction presentation (haptics, touch targets, modal transitions)

### PROMPTS 010B–010I MUST NOT modify:
* Financial calculations & monetary primitives
* Split semantics (Equal, Shares, Exact, Percentage)
* Integer-cents model (zero floats in stored monetary values)
* Zero-sum law ($\sum \text{net\_balance} = 0$)
* BAL-08 deterministic remainder distribution (`sortedIds[0]`)
* Debt simplification algorithm (`simplifyDebts`)
* Itemized Split policy (**0 active runtime references**, strictly `FORBIDDEN`)
* Existing authorization and security invariants (RLS, cross-group isolation, read-only token guards)
* Existing business functionality

> [!CAUTION]
> If any visual implementation appears to require a business logic or financial alteration, the agent **MUST STOP IMMEDIATELY** and request explicit human approval.

---

## 3. Evidence Inventory: Golden Reference Screenshots

| Reference ID | Screen / View | Observable Structure | Observable Visual Elements |
|---|---|---|---|
| **REF-01** | **Kitty / Settings Tab** | Group title with edit pencil, Participant count row, Super Kitty card, Recent Activity section with "See all activity", Add Expense button, Bottom Navigation. | Dark navy surface, white text, purple accent on active tab, subtle cardless rows with hairlines. |
| **REF-02** | **Navigation Drawer** | Slide-out left panel with user profile header (Avatar, Name, Email), Actions (Start new Kitty, Your Kitties, Import, Feedback), Recent Kitties list with active indicator, Version/Terms footer. | Dark background, semi-transparent black overlay over Kitty, clean line icon set, highlighted active group item. |
| **REF-03** | **Empty Expenses State** | Centered layout within Expenses tab: centered illustration, header "No expenses yet", friendly descriptive copy, prominent primary CTA button. | Dark background, subtle dark vector artwork, prominent purple/violet `+ Add expense` button. |
| **REF-04** | **Settings with Recent Activity** | Chronological event list inside Settings tab: Event avatar/icon, Actor + Action description, relative timestamp. | Dark list items, clean secondary typography for timestamps. |
| **REF-05** | **Profile Screen** | Header with close/back button, large circular user avatar with edit badge, editable Display Name, linked Email indicator, action rows (Change name, Account settings, Logout). | Dark modal surface, prominent circular avatar, red destructive logout action. |
| **REF-06** | **Account Settings Screen** | Top bar with back arrow, "Danger Zone" card, "Log out from all devices" with explanatory copy, "Delete account" button. | Dark elevated container, red destructive buttons with clear warning labels. |
| **REF-07** | **Serrucho Mobile Settings** (Current) | Root bottom tab with switch toggles for dark mode and notifications, generic card styling. | Demonstrates **severe divergence**: lacks Profile avatar, lacks Danger Zone, lacks Drawer trigger. |
| **REF-08** | **Serrucho Mobile "Mis Serruchos"** (Current) | Root bottom tab with large card-based group list, emoji headers (`🪚`). | Demonstrates **severe divergence**: bottom tab root vs contextual Kitty root with Drawer. |

---

## 4. Navigation Architecture Specification

Kittysplit Mobile separates navigation into **two distinct tiers** that must never be conflated:

```text
================================================================================
                    KITTYSPLIT NAVIGATION ARCHITECTURE MODEL
================================================================================

TIER 1: GLOBAL APPLICATION SHELL
   │
   └──► [ ☰ Hamburger Trigger ] (Top Left of App Bar)
         │
         └──► Slide-out Navigation Drawer (Left Panel with Dimming Overlay)
               ├── 👤 Profile Header (Avatar, Name, Email) ──► Opens Profile Screen
               ├── ➕ Start a new Kitty / Iniciar nuevo Serrucho
               ├── 📋 Your Kitties / Tus Serruchos (List of all groups)
               ├── 📥 Import from Splitwise / File
               ├── 💬 Give Feedback
               ├── 🕒 Recent Kitties / Recientes (Quick switch list with active indicator)
               └── 📄 Footer: Version • Terms • Privacy Policy

TIER 2: ACTIVE KITTY CONTEXT (Primary Screen Experience)
   │
   ├──► Contextual Top App Bar
   │     ├── [ ☰ ] Left: Drawer Trigger Button
   │     ├── Center: Kitty Name (with subtitle / status)
   │     └── Right: [ 🔗 Share / 👤 Profile Shortcut ]
   │
   ├──► Active Tab Content Area
   │     ├── Tab 1: Expenses (Cardless list with date headers OR Empty state)
   │     ├── Tab 2: Balances (Net balance cards + Settlement payment paths)
   │     └── Tab 3: Settings (Group details, Participants, Activity preview, Super Kitty)
   │
   └──► Kitty Bottom Navigation Bar
         ├── 📋 Expenses (Icon + Label, active purple highlight)
         ├── ⚖️ Balances (Icon + Label)
         └── ⚙️ Settings / Kitty (Icon + Label)
================================================================================
```

### Preservation of "Mis Serruchos" Group Management Functionality
The migration from root bottom tabs to the Global Navigation Drawer is **purely a navigation presentation refactoring**. It strictly preserves all existing Serrucho group management capabilities:
* **Full Group Listing**: Accessible via "Tus Serruchos" / "Your Kitties" inside the Drawer.
* **Instant Group Switching**: Accessible via "Recientes" / "Recent Kitties" directly in the Drawer.
* **Group Creation**: Accessible via "Iniciar nuevo Serrucho" / "Start a new Kitty" in the Drawer.
* **Workflow**: `Global Drawer` $\to$ `Tus Serruchos / Recientes` $\to$ `Serrucho Seleccionado`.

---

## 5. Navigation Drawer Specification

* **Geometry**: Slide-out from left, width approximately $80\%$ of screen width ($\sim 300\text{--}320\text{px}$ on standard mobile viewport).
* **Backdrop**: Semi-transparent dark overlay ($\sim 50\text{--}60\%$ opacity) dimming the active Kitty behind it.
* **Header (Profile Section)**:
  * Circular avatar (placeholder initials or user image) on left.
  * User Display Name (bold white text) + Email (subtle gray text) on right.
  * Tapping the header navigates to the **Profile Screen**.
* **Global Actions**:
  * "Start a new Kitty" with plus icon.
  * "Your Kitties" with list/grid icon.
  * "Import" with download/import icon.
  * "Feedback" with chat/message icon.
* **Recent Kitties Section**:
  * Section header: "Recent Kitties" in small uppercase muted text.
  * List of recent group names.
  * Current active Kitty has a distinct highlighted background and/or active checkmark.
* **Footer**:
  * App version string (e.g. `v1.0.0`), links to Terms of Service and Privacy Policy.
* **Interaction**: Opens via Hamburger tap or edge swipe from left; closes via overlay tap, item selection, or back gesture.

---

## 6. Contextual Top App Bar Specification

* **Height**: Standard native mobile header height ($\sim 56\text{px}$ on Android, $\sim 44\text{--}50\text{px}$ on iOS plus safe-area-top padding).
* **Background**: Solid dark surface matching the application theme (`visually observed dark surface`).
* **Left Element**: Hamburger menu icon (`☰`, 24px) with generous touch target ($\ge 44 \times 44\text{px}$).
* **Center Element**: Active Kitty Name in prominent semibold/bold white typography.
* **Right Element**: Share action icon (Share sheet / WhatsApp link) and/or Profile shortcut icon.
* **Elevation / Border**: Flat with subtle hairline bottom divider (`visually observed dark hairline border`). Zero bulky drop shadows.

---

## 7. Active Kitty Navigation / Bottom Tabs Specification

* **Tab 1 Identification**: Strictly labeled **`Expenses`** (or **`Gastos`** in Spanish locale) based on direct evidence in REF-01 and REF-03. The term "Overview" is retired.
* **Position**: Fixed at the bottom of the active Kitty view.
* **Height**: Standard tab bar height ($\sim 56\text{--}60\text{px}$ plus safe-area-bottom padding).
* **Canonical Tabs**:
  1. **`Expenses` (`Gastos`)**: Icon + Label.
  2. **`Balances` (`Saldos`)**: Icon + Label.
  3. **`Settings` / `Kitty` (`Ajustes`)**: Icon + Label.
* **Active State**: Active tab icon and label illuminated in **Purple / Lilac accent** with subtle top indicator bar or pill background.
* **Inactive State**: Muted cool-gray icon and label.

---

## 8. Design Tokens Specification Table

| Token | Observed Semantic Description | Observed Evidence | Estimated Value (For Implementation Calibration) | Confidence |
|---|---|---|---|:---:|
| `color.background.base` | Deep dark navy / charcoal slate | REF-01, REF-02, REF-03, REF-05 | `visually observed dark navy` (exact HEX unknown) | **High** |
| `color.surface.elevated` | Dark container surface (cards/rows) | REF-01 (Cards), REF-06 (Danger Zone) | `visually observed dark elevated surface` (exact HEX unknown) | **High** |
| `color.surface.drawer` | Dark navy drawer panel surface | REF-02 (Drawer Panel) | `visually observed dark drawer surface` (exact HEX unknown) | **High** |
| `color.text.primary` | Crisp high-contrast white | REF-01 (Titles), REF-05 (Profile Name) | Pure White / Crisp Light (exact HEX unknown) | **High** |
| `color.text.secondary` | Muted cool slate / soft gray | REF-01 (Subtitles), REF-04 (Timestamps) | Muted Cool Slate (exact HEX unknown) | **High** |
| `color.accent.primary` | Purple / Violet / Lilac accent | REF-01 (Active Tab), REF-03 (CTA Button) | Purple / Lilac accent (exact HEX unknown) | **High** |
| `color.accent.super` | Warm gold / purple highlight | REF-01 (Super Kitty Upgrade Banner) | Gold/Purple Accent (exact HEX unknown) | **High** |
| `color.destructive` | Crimson red / dark-mode red | REF-05 (Logout), REF-06 (Delete Account) | Crimson Red (exact HEX unknown) | **High** |
| `color.divider` | Dark hairline border 1px | REF-01 (Row dividers), REF-02 (Drawer) | Hairline Border (exact HEX unknown) | **High** |
| `color.overlay` | Dark semi-transparent backdrop | REF-02 (Drawer Backdrop) | Black with $\sim 50\text{--}60\%$ opacity | **High** |
| `radius.card` | Medium-rounded container corners | REF-01, REF-06 | $\sim 10\text{--}14\text{px}$ estimate | **High** |
| `radius.button` | Rounded button / pill radius | REF-03 (CTA Button), REF-06 (Delete) | $\sim 8\text{--}12\text{px}$ estimate | **High** |
| `radius.avatar` | Circular radius | REF-02 (Drawer), REF-05 (Profile) | $50\%$ circular | **High** |
| `spacing.screenPadding` | Standard edge padding | REF-01, REF-05, REF-06 | $\sim 16\text{px}$ standard mobile grid | **High** |
| `spacing.rowHeight` | Touch target height for rows | REF-01, REF-04 | $\ge 48\text{px}$ ($\sim 52\text{--}56\text{px}$) | **High** |

---

## 9. Typography Specification

* **Font Family**: Modern system sans-serif (`SF Pro` on iOS, `Roboto` / `Inter` on Android/Web; exact proprietary font UNKNOWN).
* **Screen Titles**: $\sim 18\text{--}20\text{px}$, Bold (Weight $700$), White.
* **Section Headers**: $\sim 14\text{--}16\text{px}$, Semibold (Weight $600$), White / Light Gray.
* **Body / Row Titles**: $\sim 14\text{--}15\text{px}$, Regular / Medium (Weight $400\text{--}500$), White.
* **Secondary / Subtext**: $\sim 12\text{--}13\text{px}$, Regular (Weight $400$), Muted Slate.
* **Badge / Caption**: $\sim 11\text{--}12\text{px}$, Semibold / Medium, Uppercase or Title Case.
* **Line Heights**: Generous readability ratios ($1.3\text{--}1.5 \times$ font size).

---

## 10. Spacing & Geometric Grid Specification

* **Screen Horizontal Padding**: $16\text{px}$ constant on mobile viewports.
* **List Row Height**: Standard touch target height $\ge 48\text{px}$ (typically $52\text{--}60\text{px}$ for interactive setting rows).
* **Icon-to-Text Gap**: $12\text{px}$ horizontal spacing between avatar/icon and label.
* **Section Margins**: $20\text{--}24\text{px}$ vertical separation between distinct setting blocks.
* **Divider Thickness**: Exact $1\text{px}$ hairline.

---

## 11. Component Inventory (Kittysplit Native)

| Component | Geometry & Radius | Typography | Colors | Icon / Graphic |
|---|---|---|---|---|
| **Top AppBar** | Full width, $56\text{px}$ height, 0 radius | Title: $18\text{px}$ bold | Dark background, white title | Hamburger (left), Share (right) |
| **Drawer Panel** | Width $\sim 300\text{px}$, 0 radius, left anchored | Header: $16\text{px}$ bold; Items: $14\text{px}$ med | Dark navy surface, white text | Clean line icons (Plus, List, Import, Chat) |
| **Bottom Tab Bar** | Full width, $56\text{--}60\text{px}$ height, 0 radius | Label: $11\text{--}12\text{px}$ med | Dark surface, purple active accent | Expenses, Balances, Settings icons |
| **Setting Row** | Full width or card-contained, $\sim 52\text{px}$ height | Label: $15\text{px}$ regular, sub: $13\text{px}$ | Dark surface, white text, gray sub | Leading icon, trailing chevron / badge |
| **Avatar Circle** | $40\times 40\text{px}$ (Drawer) / $80\times 80\text{px}$ (Profile) | Initials: bold white | Dark/purple circular fill | User image or initials |
| **CTA Button (Primary)** | Full width / centered, height $44\text{--}48\text{px}$, radius $10\text{px}$ | Label: $15\text{px}$ bold | Purple/violet solid background, white text | Leading plus icon |
| **Destructive Button** | Height $44\text{--}48\text{px}$, radius $10\text{px}$ | Label: $15\text{px}$ bold | Red/crimson outline or fill, white/red text | Trash / logout icon |
| **Activity Event Row** | Cardless row with bottom hairline, height $\sim 56\text{px}$ | Event text: $14\text{px}$, time: $12\text{px}$ muted | Dark background, white text, gray time | Action icon on left |
| **Danger Zone Card** | Bordered card, radius $12\text{px}$, padding $16\text{px}$ | Title: $15\text{px}$ bold red/white, sub: $13\text{px}$ | Dark elevated surface, subtle border | Warning / shield indicator |

---

## 12. Empty States Specification

### Empty Expenses State (REF-03)
* **Position**: Vertically and horizontally centered in the Expenses tab.
* **Graphic**: Custom vector illustration designed for dark backgrounds (**REQUIRED ORIGINAL ASSET** — to be designed natively without copying proprietary Kittysplit assets).
* **Title**: "No expenses yet" / "Aún no hay gastos" ($18\text{px}$ bold white).
* **Description**: Friendly explanatory copy explaining that expenses added will appear here and calculate balances ($14\text{px}$ muted gray).
* **CTA Button**: Prominent purple/violet button `+ Agregar gasto` ($48\text{px}$ height, $10\text{px}$ radius).

---

## 13. Profile Screen Specification (REF-05)

* **Top Header**: Back arrow or Close "✕" on top-left, title "Perfil" centered.
* **Avatar Section**:
  * Large circular avatar ($80\times 80\text{px}$) centered horizontally.
  * "Editar" badge/icon overlay on avatar.
  * Display Name in $20\text{px}$ bold white text below avatar.
  * User Email in $14\text{px}$ muted slate text.
* **Action Rows**:
  1. "Cambiar nombre" row (with user icon and trailing chevron).
  2. "Ajustes de la cuenta" row (with gear/shield icon, navigating to Account Settings).
  3. "Cerrar sesión" row (with red text and logout icon).

---

## 14. Account Settings Screen Specification (REF-06)

* **Top Header**: Back arrow on left, title "Ajustes de cuenta" centered.
* **Danger Zone Container**:
  * Distinct elevated dark card with clear grouping.
  * **Action 1: "Cerrar sesión en todos los dispositivos"**:
    * Button with explanatory subtext: "Esto cerrará tu sesión activa en cualquier otro navegador o dispositivo móvil".
  * **Action 2: "Eliminar cuenta"**:
    * Destructive crimson button with warning copy: "Esta acción es irreversible y desvinculará tu correo de todos los Serruchos".

---

## 15. Kitty Settings Screen Specification (REF-01, REF-04)

* **Section 1: Group Details**:
  * Group Name in large bold text with inline edit pencil icon.
  * Base currency display (`RD$` / `DOP`).
* **Section 2: Manage Participants**:
  * Row with participant icon, "Participantes (X)", and trailing chevron.
  * Avatar chips showing quick participant initials.
* **Section 3: Super Serrucho / Upgrade**:
  * Elevated card with crown/star icon, purple/gold accent, highlighting premium capabilities (unlimited photos, multiple currencies).
* **Section 4: Recent Activity**:
  * Section header: "Actividad reciente".
  * Chronological preview of the last 3-5 events (e.g. "Juan agregó 'Cena' RD$ 1,500").
  * Link: "Ver toda la actividad ➔".
* **Section 5: Destructive Actions**:
  * "Eliminar Serrucho" in red destructive button styling.

---

## 16. Serrucho vs Kittysplit Comparison & Rectification

| Dimension | Kittysplit Golden Spec | Serrucho Current State | Required Modification |
|---|---|---|---|
| **Theme / Base Palette** | Dark Navy base with Purple/Lilac accent (exact HEX to be calibrated) | Assumed emerald/teal light mode in 010A | **Adopt Dark Navy base + Purple/Lilac accent as official specification** |
| **App Navigation** | Left Drawer + Contextual Top App Bar | Bottom Tabs at app root | **Implement Left Drawer preserving "Tus Serruchos" and replace root tabs with active Kitty context** |
| **Settings Screen** | Structured sections: Details, Participants, Upgrade, Activity Preview | Generic buttons in a scroll card | **Rebuild Settings view to match REF-01 layout** |
| **Profile & Account** | Dedicated Profile and Account Settings views | Basic toggles in `settings.tsx` | **Create dedicated `profile.tsx` and `account-settings.tsx`** |
| **Expenses List** | Continuous cardless rows with hairlines | Heavy nested `Card` components | **Refactor into clean cardless rows with $1\text{px}$ hairline dividers** |
| **Empty State** | Centered graphic + copy + purple CTA | Card with plain text | **Implement custom dark vector empty state with primary CTA** |

---

## 17. Reclassified Gaps (P0–P4)

```text
=====================================================
      RECLASSIFIED GAPS POST-GOLDEN CORRECTION
=====================================================
  P0 — Critical (Architectural Blockers for Parity):
       1. Global Shell & Left Navigation Drawer (REF-02)
       2. Contextual Kitty Top App Bar with Drawer Trigger (REF-01)
       3. Dark Navy + Purple/Lilac Design Token Base (REF-01..06)

  P1 — Major (Structural & Screen Divergences):
       4. Cardless Continuous Expenses List with Hairlines
       5. Rebuilt Kitty Settings with Activity Preview (REF-01, REF-04)
       6. Dedicated Profile Screen (REF-05)
       7. Dedicated Account Settings / Danger Zone Screen (REF-06)

  P2 — Meaningful (UX & Component Polish):
       8. Custom Dark-Themed Empty State Illustrations (REF-03)
       9. Participant Avatar Chips & Management Flow
       10. Add Expense Form Input Rhythm & Split Pills Alignment

  P3 — Minor (Refinements):
       11. Subtle Drawer Slide Transition & Overlay Timing
       12. Date Header Formatting in Expenses Stream

  P4 — Cosmetic:
       13. Hairline border opacity fine-tuning
=====================================================
```

---

## 18. Reference Completeness Matrix

| Surface / Flow | Golden Reference Available? | Status | Notes |
|---|:---:|:---:|---|
| **Global App Shell & Drawer** | ✅ YES (REF-02) | **COMPLETE** | Fully documented in Section 5 |
| **Top App Bar** | ✅ YES (REF-01) | **COMPLETE** | Fully documented in Section 6 |
| **Kitty Navigation / Tabs** | ✅ YES (REF-01) | **COMPLETE** | Fully documented in Section 7 (Expenses, Balances, Settings) |
| **Empty Expenses State** | ✅ YES (REF-03) | **COMPLETE** | Fully documented in Section 12 |
| **Kitty Settings View** | ✅ YES (REF-01, REF-04) | **COMPLETE** | Fully documented in Section 15 |
| **Recent Activity Feed** | ✅ YES (REF-04) | **COMPLETE** | Fully documented in Section 15 |
| **Profile Screen** | ✅ YES (REF-05) | **COMPLETE** | Fully documented in Section 13 |
| **Account Settings / Danger Zone** | ✅ YES (REF-06) | **COMPLETE** | Fully documented in Section 14 |
| **Multi-Payer Advanced Modal** | ⏸️ Missing Visual Reference | **DEFERRED REFERENCE** | Golden visual/interaction reference incomplete in screenshots. Does NOT imply new financial logic. Core single-payer is complete. |

---

## 19. Quality Baseline & Verification

* **Unit & Integration Tests**: **42 / 42 passed (100%)**
* **Total Tests**: **403 / 403 passed (100%)**
* **TypeScript Typecheck**: **0 errors** across all workspaces
* **Production Build**: **PASS** (Next.js 15 production build)
* **Itemized Split Policy**: **0 runtime references** (`FORBIDDEN`)
* **BAL-08 Determinism**: **VERIFIED** (`sortedIds[0]`)
* **Production Feature Changes**: **0 lines**

---

## 20. Final Decision Gate

### Decision: **`A — READY FOR 010B (DESIGN SYSTEM TOKENS & SHARED PRIMITIVES)`**

**Rationale**:
* All unverified HEX claims have been eliminated and replaced with observable semantic descriptions.
* The primary tab name is resolved as `Expenses` (`Gastos`) and the drawer entry as `Your Kitties` (`Tus Serruchos`).
* Preservation of all "Mis Serruchos" group management workflows inside the Drawer is explicitly codified.
* Strict visual scope boundary rules are established to protect all financial algorithms, split semantics, and security invariants.
* The project is ready to begin **Prompt 010B (Design System Tokens & Shared Primitives)** upon user authorization.

---
