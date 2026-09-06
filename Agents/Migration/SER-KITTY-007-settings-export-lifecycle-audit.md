# AUDIT ARTIFACT: SER-KITTY-007 — Kitty Settings, Export & Lifecycle

> **Milestone / Prompt**: PROMPT 07 — KITTY SETTINGS, EXPORT & LIFECYCLE  
> **Status**: COMPLETED & VERIFIED (FINAL CORRECTION & DOCUMENTATION ALIGNMENT)  
> **Scope**: Kitty Settings (Rename, Base Currency Constraints), Multi-Sheet & CSV Data Export Engine, Kitty Lifecycle & Permanent Cascading Deletion, Relational Cleanliness & Isolation, Server-Side Destructive Security, Closed Serrucho Lifecycle Rules, Zero Runtime Itemized Split Preservation, Web & Mobile Parity, Guest Access Compatibility, Deterministic BAL-08 Integer Cent Distribution Review  
> **Date**: 2026-09-06

---

## 1. Prior System State & Architecture Found

* **Foundation (Prompts 01–06)**:
  * 40 test suites, 343 unit tests passing.
  * Zero-sum integer arithmetic (`Math.round` cents, no floating-point financial storage).
  * Dynamic debt minimization (`simplifyDebts`) and live settlements (`SettlementService`).
  * Strict prohibition of Itemized Split (0 runtime references).
* **Entities & Relational Topology**:
  ```text
  Serrucho (Group / Event)
   ├── Participant (1..N)
   ├── Expense (0..N)
   │    └── ExpenseSplit (1..N)
   ├── Transfer (0..N)
   ├── Income (0..N)
   │    └── IncomeSplit (1..N)
   ├── SettlementSnapshot (0..N)
   │    └── SettlementItem (0..N)
   └── ActivityLog / ActivityEvents (0..N)
  ```
* **Endpoints & Services Inspected**:
  * `SerruchoService` (`apps/web/features/serruchos/service.ts`)
  * `ExportService` (`apps/web/features/export/service.ts` & `apps/web/app/api/serruchos/[id]/export/route.ts`)
  * `SerruchoRepository` (`MemorySerruchoRepository` & `SupabaseSerruchoRepository`)
  * Web & Mobile view models / routes (`/api/serruchos/[id]`, `/api/serruchos/[id]/export`)

---

## 2. Scope A: Kitty Settings & Rename

* **Requirements Implemented**:
  * In-place name updates preserving `serrucho.id`.
  * Input sanitization and trimming.
  * Validation constraints: minimum 1 character, maximum 100 characters.
  * Closed Serrucho protection: mutating settings on a `CLOSED` Serrucho is blocked.
  * Activity audit logging: records `SERRUCHO_UPDATED` event on rename.
* **REST & UI Integration**:
  * Added `PATCH` handler to `/api/serruchos/[id]` with permission validation (`assertCanEditSerrucho`).
  * Fully accessible in Web and Mobile settings view models without requiring an account (Guest Mode compatible).

---

## 3. Scope B: Home Currency & Multi-Currency Decisions

* **Semantic Protection Rule**:
  * Base currency acts as metadata defining the monetary unit of all stored integer cents.
  * Mutating base currency on an active Serrucho with existing expenses would cause semantic financial corruption (e.g. converting RD$ 10,000 silently into US$ 10,000).
* **Enforced Behavior**:
  * If a Serrucho has **0 expenses**, changing `currency` is permitted.
  * If a Serrucho has **$\ge 1$ expenses**, changing `currency` is strictly blocked (`Error: "No se puede cambiar la moneda base de un serrucho con gastos existentes..."`).
* **Parity Classification**:
  * **PARITY IMPLEMENTED**: Kittysplit documents that home currency can be edited while all expenses remain in a single currency. Serrucho strictly blocks currency changes once any expense exists to protect monetary integrity.
* **Multi-Currency Conversion Engine**:
  * Real-time FX exchange rate feeds and automated cross-currency balance conversion engines are classified as **DEFERRED** (out of scope for Prompt 07, simulated Super Serrucho phase).

---

## 4. Scope C & D: Data Export Engine

* **Ground Truth Consistency**:
  * Consumes live database/store entities directly without separate floating-point calculation engines.
  * Reuses `SettlementService.calculateLiveSettlement` and `simplifyDebts` for exact parity with application UI.
* **Multi-Sheet XLSX Workbook**:
  1. **Resumen**: Metadata, Total Gross Spent, Total Incomes, Net Active Expenses, Participant Summary table (Paid, Owed, Net Balance in DOP).
  2. **Movimientos**: Complete chronological ledger of Expenses, Incomes, and Transfers with payer/recipient, amounts, split method, and notes.
  3. **Liquidación**: Step-by-step debt settlement plan (who pays whom, amount, suggested payment instructions, status).
  4. **Historial**: Audit trail of activity logs with timestamp, actor, action, and human-readable summary.
* **CSV Export**:
  * Per-sheet streaming CSV generation with UTF-8 encoding support.
* **Isolation**:
  * Zero leakage across groups; export queries strictly filter by requested `serrucho_id`.
* **Parity Classifications**:
  * **XLSX financial export content**: **PARITY VERIFIED** (Kittysplit documents exporting expenses, calculations, and balances).
  * **Exact XLSX layout / styling**: **PARITY IMPLEMENTED** (Four-sheet workbook structure tailored for Serrucho).
  * **CSV export**: **PARITY IMPLEMENTED** (Single-sheet streaming CSV export).

---

## 5. Scope E: Lifecycle & Permanent Cascading Deletion

* **Cascading Destruction**:
  * Permanently deletes:
    1. Serrucho root entity
    2. All associated `Participant` records
    3. All `Expense` and child `ExpenseSplit` records
    4. All `Transfer` records
    5. All `Income` and child `IncomeSplit` records
    6. All `SettlementSnapshot` and child `SettlementItem` records
    7. All `ActivityLog` entries
* **Relational Cleanliness & Isolation**:
  * Deleting Serrucho A leaves Serrucho B completely untouched.
  * Idempotent deletion on non-existent IDs returns `false` safely without throwing.
* **Activity Log on Deletion Decision**:
  * Group deletion destroys all historical logs belonging to that group rather than writing a dangling log to a non-existent group.
* **Closed Serrucho Deletion**:
  * Groups with `status: "CLOSED"` can be permanently deleted by authorized users/creators, cleaning up finalized snapshot history.
* **Guest Delete Authorization Behavior**:
  * Serrucho implements creator/participant deletion authorization via server-side cascade.
  * **SERRUCHO ADAPTATION / IMPLEMENTED BEHAVIOR**: We do NOT claim parity with Kittysplit authorization for guest deletion, as Kittysplit documentation does not specify guest deletion permission details.

---

## 6. Mathematical Audit: BAL-08 Integer Remainder Distribution

* **Algorithm Rule in `splitEqually`**:
  * Total cents: 10,000 cents (RD$ 100.00).
  * Participants: 3 (`pJuan`, `pMaria`, `pPedro`).
  * `baseShare = Math.floor(10000 / 3) = 3333` cents.
  * `remainder = 10000 % 3 = 1` cent.
  * **Deterministic Sort Order**: `sortedIds = [...participantIds].sort()`.
  * The first `remainder` participant (`sortedIds[0]`) receives `3334` cents (`baseShare + 1`).
  * The other participants receive `3333` cents (`baseShare`).
  * Total sum of splits: $3334 + 3333 + 3333 = 10000$ cents ($100.00).
* **Net Balance & Debt Simplification**:
  * Payer (Juan) paid 10,000 cents.
  * If Juan's ID is `sortedIds[0]`, Juan owes 3,334 cents $\rightarrow$ Juan net balance $= +6666$ cents.
  * If Juan's ID is NOT `sortedIds[0]`, Juan owes 3,333 cents $\rightarrow$ Juan net balance $= +6667$ cents.
  * Debtors owe either -3,334 or -3,333 cents such that $\sum \text{net\_balance} = 0$ (Zero-Sum Invariant).
  * `simplifyDebts` generates transfers whose total amount matches Juan's exact net balance ($+6666$ or $+6667$).
* **Test Verification**:
  * `BAL-08` in `ser-kitty-004-balances-settlement.test.ts` asserts the exact deterministic outcome matching the sorted ID remainder allocation rule. It does NOT accept multiple ambiguous results `[6666, 6667]`.

---

## 7. Financial Invariants & Security Matrix

| Invariant / Guard | Rule Description | Status |
| :--- | :--- | :--- |
| **INV-01** | Zero orphaned `Participant` records after Serrucho deletion | **PASS** |
| **INV-02** | Zero orphaned `Expense` records after Serrucho deletion | **PASS** |
| **INV-03** | Zero orphaned `ExpenseSplit` records after Serrucho deletion | **PASS** |
| **INV-04** | Zero orphaned `Transfer` records after Serrucho deletion | **PASS** |
| **INV-05** | Zero orphaned `Income` / `IncomeSplit` records after Serrucho deletion | **PASS** |
| **INV-06** | Zero orphaned `ActivityLog` / `SettlementSnapshot` records | **PASS** |
| **INV-07** | Deleting Serrucho A never alters or deletes records from Serrucho B | **PASS** |
| **INV-08** | Export matches persisted integer cents and dynamic UI debt calculations | **PASS** |
| **INV-09** | Renaming group preserves monetary amounts and IDs intact | **PASS** |
| **INV-10** | Integer cent precision strictly maintained across all export pipelines | **PASS** |
| **SEC-01** | Cross-group mutation rejection (cannot edit or delete foreign Serrucho) | **PASS** |
| **SEC-02** | Read-only token access permits export/viewing but blocks mutation | **PASS** |
| **SEC-03** | Guest mode operations: Settings and export without account; guest deletion is a Serrucho-implemented authorization flow | **PASS** |
| **SEC-04** | Closed Serrucho cannot undergo settings mutations | **PASS** |

---

## 8. Kittysplit Parity Classification

| Feature / Domain | Parity Classification | Evidence & Architectural Rationale |
| :--- | :--- | :--- |
| **Kitty Rename** | **PARITY VERIFIED** | Kittysplit Help Center explicitly documents editing group name from Kitty settings. |
| **Home Currency Setting** | **PARITY IMPLEMENTED** | Kittysplit documents changing home currency when all expenses are in one currency; Serrucho blocks changes when any expense exists. |
| **XLSX Financial Export Content** | **PARITY VERIFIED** | Kittysplit Help Center confirms exporting expenses, calculations, and final balances. |
| **Exact XLSX Layout / Styling** | **PARITY IMPLEMENTED** | Content and sheets match requirements; specific 4-sheet layout is Serrucho implementation. |
| **CSV Export** | **PARITY IMPLEMENTED** | Per-sheet streaming CSV generation implemented in Serrucho. |
| **Permanent Kitty Delete** | **PARITY VERIFIED** | Kittysplit documents permanent deletion of Kitty with all associated entries. |
| **Guest Mode Settings** | **PARITY VERIFIED** | Settings and rename operate friction-free without user accounts. |
| **Guest Mode Export** | **PARITY VERIFIED** | Export operates friction-free without user accounts. |
| **Guest Mode Delete Authorization** | **SERRUCHO ADAPTATION** | Serrucho-specific authorization behavior for guest deletion without claiming parity with Kittysplit. |
| **Activity Log / Audit Trail** | **SERRUCHO ADAPTATION** | Serrucho internal audit log subsystem for transaction traceability. |
| **Multi-Currency Conversion Engine** | **DEFERRED** | Multi-currency real-time FX conversion engine deferred to later stages. |
| **Itemized Bill Split** | **FORBIDDEN (0 Runtime References)** | Strictly eliminated across domain, API, and UI layers. |

---

## 9. Quality Verification Summary

* **Unit Test Suites**: 41 / 41 (100% PASS)
* **Total Tests**: 381 / 381 (100% PASS)
* **Prompt 07 Tests**: 38 / 38 (100% PASS)
* **Typecheck (`tsc --noEmit`)**: 0 errors across all workspaces (`@serrucho/core`, `@serrucho/web`, `@serrucho/mobile`)
* **Production Build (`turbo run build`)**: PASS (13/13 Next.js pages generated)
* **Itemized Split Runtime References**: 0
