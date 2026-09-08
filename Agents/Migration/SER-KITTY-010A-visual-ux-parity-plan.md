# IMPLEMENTATION PLAN: SER-KITTY-010A — High-Fidelity Kittysplit Visual & UX Parity Plan

> **Milestone / Prompt**: PROMPT 10A — GLOBAL KITTYsplit VISUAL + UX PARITY CAPABILITY AUDIT  
> **Phase**: PHASE B — IMPLEMENTATION PLAN (SEQUENTIAL MODULAR PROMPTS)  
> **Status**: APPROVED FOR MODULAR EXECUTION  
> **Target**: Elevate Serrucho Mobile and Web from Level 1 to Level 3 (High-Fidelity Visual + UX Parity)  
> **Date**: 2026-09-07  

---

## 1. Plan Overview & Execution Principles

This implementation plan defines the **structured, multi-stage roadmap** to eliminate all visual, layout, navigational, and interaction gaps identified in the Prompt 10A Audit.

### Core Principles
1. **Zero Financial Logic Regressions**: Preserve all integer-cents calculations, zero-sum invariants, BAL-08 deterministic distribution, and greedy debt simplification.
2. **Strict Zero Runtime Itemized Policy**: Maintain 0 active runtime references to Itemized Split (`FORBIDDEN`).
3. **Sequential Execution**: Execute one modular prompt at a time with mandatory human confirmation between prompts.
4. **Dominican Context Preservation**: Retain Dominican Peso (`RD$`), WhatsApp deep link sharing, Dominican banks, and $0 cost architecture.
5. **No Production Feature Changes in Phase A**: This plan is a specification artifact ready for execution upon user authorization.

---

## 2. Modular Prompt Roadmap

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   KITTYsplit VISUAL PARITY ROADMAP                     │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PROMPT 010B: Design System Tokens & Shared Primitives               │
│    └─ Typography, Spacing, Emerald/Teal Palette, Hairline Dividers    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. PROMPT 010C: Mobile Navigation Shell & Slide-out Drawer             │
│    └─ Left Navigation Drawer, Top App Bar, Recent Kitties Quick-Switch │
├────────────────────────────────────────────────────────────────────────┤
│ 3. PROMPT 010D: Mobile Core Group Views (Expenses & Balances)          │
│    └─ Cardless Flat List, Category Icons, Settlement Balance Cards     │
├────────────────────────────────────────────────────────────────────────┤
│ 4. PROMPT 010E: Mobile Kitty Settings, Activity & Participant Chips    │
│    └─ Group Settings Layout, Participant Avatars, Activity Preview     │
├────────────────────────────────────────────────────────────────────────┤
│ 5. PROMPT 010F: Mobile Profile & Account Management Screens            │
│    └─ Dedicated Profile View, Account Settings, Device Sessions        │
├────────────────────────────────────────────────────────────────────────┤
│ 6. PROMPT 010G: Mobile Empty, Loading & Error States                   │
│    └─ Bespoke Vector Graphics for Empty Expenses / Balances            │
├────────────────────────────────────────────────────────────────────────┤
│ 7. PROMPT 010H: Web Visual & Responsive Parity Alignment               │
│    └─ Desktop / Tablet / Mobile Web matching Mobile visual signature   │
├────────────────────────────────────────────────────────────────────────┤
│ 8. PROMPT 010I: Screenshot Regression, Visual QA & Gate Acceptance     │
│    └─ Side-by-side verification against golden references, 403+ tests  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Specification per Prompt

### PROMPT 010B — Design System Tokens & Shared Primitives
* **Goal**: Build the unified design token engine for Mobile and Web.
* **Scope**:
  * Centralize semantic colors: Kittysplit signature emerald/teal (`#00a896`, `#028090`, `#e6f6f4`), warm coral accent (`#f26419`), surface white (`#ffffff`), slate borders (`#e2e8f0`, `#f1f5f9`), neutral text hierarchy (`#0f172a`, `#334155`, `#64748b`).
  * Strict typography scale (Title 18-20px bold, Subheading 15-16px semibold, Body 14px regular, Caption 12px medium).
  * 4-point spacing grid (`4, 8, 12, 16, 24, 32, 48px`).
  * Shared UI primitives: `HairlineDivider`, `CategoryAvatar`, `ParticipantPill`, `BadgePill`.

### PROMPT 010C — Mobile Navigation Shell & Slide-out Drawer
* **Goal**: Re-architect mobile navigation to match Kittysplit's Drawer-first model.
* **Scope**:
  * Implement Slide-out Left Navigation Drawer with animated overlay.
  * Drawer contents: User Profile header (avatar + name/email), "Iniciar nuevo Serrucho", "Tus Serruchos", "Importar", "Comentarios", and Recent Serruchos list with active indicator.
  * Contextual Kitty Top App Bar with Hamburger menu button, Kitty title, and right action buttons (Share WhatsApp / Profile).

### PROMPT 010D — Mobile Core Group Views (Expenses & Balances)
* **Goal**: Eliminate heavy card clutter and reproduce Kittysplit's elegant cardless lists.
* **Scope**:
  * **Expenses Tab**: Continuous list grouped by date, category avatar on left, description + payer subtext in center, bold formatted amount on right, separated by hairline dividers.
  * **Balances Tab**: Clean net balance rings/cards per participant, and minimal settlement payment paths with 1-tap "Saldar / Record Payment".
  * **Floating / Sticky Action**: Prominent `+ Agregar Gasto` button at bottom.

### PROMPT 010E — Mobile Kitty Settings, Activity & Participant Chips
* **Goal**: Redesign the Kitty Settings view to match Kittysplit's native layout.
* **Scope**:
  * Group name editing in-place.
  * "Manage Participants" section with horizontal/grid avatar chips and add/edit flow.
  * "Super Serrucho" upgrade banner / card.
  * "Recent Activity" timeline preview with "Ver toda la actividad" link.
  * Permanent delete action in destructive zone.

### PROMPT 010F — Mobile Profile & Account Management Screens
* **Goal**: Implement dedicated Profile and Account Settings views.
* **Scope**:
  * `app/profile.tsx`: Avatar display, display name edit, linked email status.
  * `app/account-settings.tsx`: Magic link email connection, session logout, logout from all devices, delete account flow.

### PROMPT 010G — Mobile Empty, Loading & Error States
* **Goal**: Recreate high-fidelity illustrated empty states.
* **Scope**:
  * Empty Expenses illustration with centered friendly copy and `+ Add expense` button.
  * Empty Balances illustration ("¡Todo saldado! No hay deudas pendientes").
  * Skeleton loading screens and offline banner.

### PROMPT 010H — Web Visual & Responsive Parity Alignment
* **Goal**: Bring `@serrucho/web` to visual parity with the refreshed design system.
* **Scope**:
  * Align desktop sidebar / mobile navigation drawer on web.
  * Refactor `/dashboard/[id]` and `/k/[id]` to match the cardless list styling and emerald palette.
  * Ensure responsive continuity across mobile web, tablet, and desktop viewports.

### PROMPT 010I — Screenshot Regression, Visual QA & Final Acceptance Gate
* **Goal**: Validate high-fidelity parity against reference screenshots.
* **Scope**:
  * Side-by-side comparison against golden references.
  * Full test suite verification (403+ tests passing, 0 typecheck errors, build passing).
  * Formal sign-off for Level 3 Parity.

---
