# SER-KITTY-003 — Expense Entry & Canonical Split Engine Audit

## 1. Existing State
Prior to this audit, Serrucho had mathematical functions and UI components for adding expenses, but certain dialogs exposed non-canonical split options (such as percentage as a standalone tab or remnants of itemized concepts in comments/forms). Additionally, whitespace-only descriptions were not strictly filtered at the Zod schema boundary.

## 2. Domain Engine
- **Location**: `packages/core/src/finance/math.ts`
- **Integer Cents Representation**: All financial amounts are calculated and stored in integer cents (`toCents`, `fromCents`, `amount_cents`). Zero float representation for money in domain logic.
- **Methods Supported**:
  1. `splitEqually`: Even distribution with deterministic remainder distribution (`totalCents % participantCount` cents distributed alphabetically by participant ID).
  2. `splitByShares`: Weight-based split with fractional remainder sorting and support for decimal shares (e.g., 1.5, 0.5) without integer truncation.
  3. `splitByExactAmounts`: Fixed amount split validating that `sum(individual amounts) === totalCents`.
- **Debt Simplification**: `simplifyDebts` preserves min-cash-flow algorithm with deterministic ID tie-breaking.

## 3. UI
- **Web**:
  - `AddExpenseDialog` (`apps/web/features/expenses/components/add-expense-dialog.tsx`): 3 canonical split options: "Equitativo", "Cuotas (Shares)", "Montos Fijos (RD$)". Clean description validation, live quota per person preview, and remainder distribution button.
  - `EditExpenseDialog` (`apps/web/features/expenses/components/edit-expense-dialog.tsx`): 3-column split selector, dynamic recalculation on amount/participant change, and full edit lifecycle.
- **Mobile**:
  - `AddExpenseScreen` (`apps/mobile/app/serrucho/add-expense.tsx`): 3 segment options ("Igual =", "Cuotas ⚖️", "RD$ Exacto") with tactile haptics, participant toggle, and integer cents persistence.
  - `SerruchoDetailScreen` (`apps/mobile/app/serrucho/[id].tsx`): Expense modal inspection and deletion with immediate balance recalculation.

## 4. Data Model
- `Expense`: `id`, `serrucho_id`, `paid_by_participant_id`, `description`, `amount_cents`, `split_method`, `expense_date`, `created_at`, `updated_at`.
- `ExpenseSplit`: `expense_id`, `participant_id`, `owed_cents`, `percentage_basis_points`.
- All monetary fields strictly stored in integer cents.

## 5. Itemized Audit
- Exhaustive search for `itemized`, `Itemized`, `splitByItems`, `receipt items`, `perItem`, `itemsSplit`:
  - `packages/core`: Zero active itemized functions or types.
  - `apps/web`: Zero itemized UI tabs or calculation logic. Removed dead code handlers.
  - `apps/mobile`: Zero itemized screens.
  - All remaining references exist strictly in historical migration and audit documentation (`KITTY_SPLIT_REMOVALS.md`, `KITTY_SPLIT_DECISIONS.md`).

## 6. Reused Code
- Reused `splitEqually`, `splitByShares`, `splitByExactAmounts`, `simplifyDebts`, `calculateNetBalances`, `toCents`, `fromCents`, `formatDOP` in `@serrucho/core`.
- Reused `ExpenseService` in `@/features/expenses/service`.

## 7. Modified Code
- `packages/core/src/validations/schemas.ts`: Added `.trim().min(1)` to `expenseSchema.description`.
- `apps/web/lib/validations/schemas.ts`: Added `.trim().min(1)` to `expenseSchema.description`.
- `apps/web/features/expenses/components/add-expense-dialog.tsx`: Cleaned split tabs and removed dead itemized handlers.
- `apps/web/features/expenses/components/edit-expense-dialog.tsx`: Streamlined split tabs to 3 canonical columns.

## 8. Deleted Code
- Removed non-canonical split handlers and dead itemized references in active application components.

## 9. Kittysplit Parity Classification
- **Add Expense Flow**: PARITY VERIFIED
- **Payer Selection**: PARITY VERIFIED
- **Equal Split with Deterministic Cents**: PARITY VERIFIED
- **Shares Split (including decimal shares)**: PARITY VERIFIED
- **Fixed Amount Split with Exact Remainder Validation**: PARITY VERIFIED
- **Integer Cents Representation**: PARITY VERIFIED
- **Edit & Delete Expense Lifecycle**: PARITY VERIFIED
- **Mobile & Web Dual Parity**: PARITY VERIFIED
- **Dominican Peso Localization (RD$)**: SERRUCHO ADAPTATION
- **WhatsApp Deep Links Integration**: SERRUCHO ADAPTATION
- **Zero Cloud Costs Architecture ($0)**: SERRUCHO ADAPTATION
