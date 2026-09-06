# AUDIT ARTIFACT: SER-KITTY-006 — Edit, Delete & Transaction Audit / History

> **Milestone / Prompt**: PROMPT 06 — EDIT, DELETE & TRANSACTION AUDIT / HISTORY  
> **Status**: COMPLETED & VERIFIED (FINAL DOCUMENTATION ALIGNMENT)  
> **Scope**: Expense/Transfer/Income Edit & Delete, Atomic Split Replacements, Dynamic Financial Recalculations, ActivityLog / Audit Trail, Settlement Interactions, Server-side Guards (Closed Serrucho, Cross-Serrucho), Web & Mobile Parity, Itemized Split Elimination Verification, BAL-08 Integer Remainder Documentation  
> **Date**: 2026-09-06

---

## 1. Existing Transaction Architecture
* **Entities & Relationships**:
  ```text
  Serrucho (Group / Event)
   ├── Participant (1..N)
   ├── Expense (0..N)
   │    └── ExpenseSplit (1..N, amount sum === expense.amount_cents)
   ├── Transfer (0..N, sender_participant_id, receiver_participant_id, amount_cents)
   ├── Income (0..N, received_by_participant_id, amount_cents)
   │    └── IncomeSplit (1..N, credit sum === income.amount_cents)
   └── ActivityLog (0..N, audit events: created, updated, deleted)
  ```
* **Ground Truth Computation**: Financial state is never derived from stale cached totals. All participant balances (`calculateParticipantBalances`) and simplified debt graphs (`simplifyDebts`) are dynamically recalculated from the persisted set of valid expenses, splits, transfers, and incomes.
* **ID Invariance**: Transaction IDs (`expense.id`, `transfer.id`, `income.id`) remain immutable across updates. Mutations never destroy and recreate records to simulate edits.

---

## 2. Expense Edit Semantics
* **Supported Editable Fields**:
  * `description` (sanitized string)
  * `amount_cents` (positive integer cents)
  * `paid_by_participant_id` (must belong to the same Serrucho)
  * `category` (standard expense categories)
  * `split_method` (`EQUAL`, `SHARES`, `EXACT`, `PERCENTAGE`)
  * `splits` (`ExpenseSplit[]` mapping participant IDs to exact integer cent amounts)
* **Split Methods Classification**:
  * Kittysplit documentation demonstrates 3 core methods: Equal, Fixed/Set Amount (`EXACT`), and `SHARES`.
  * `PERCENTAGE` is preserved as currently implemented in Serrucho and classified as a **SERRUCHO ADAPTATION**.
* **Itemized Split Elimination (100% Enforced)**:
  * **Itemized Split (dish-by-dish bill splitter) is 100% eliminated from runtime, domain types, validators, and UI components (0 runtime references)**.
* **Atomic Split Replacement**: When splits or split methods are modified, the existing splits associated with the `expense.id` are replaced atomically in the persistent store.
* **Integrity Invariants**:
  * $\sum \text{split.amount\_cents} = \text{expense.amount\_cents}$
  * Zero-sum balance invariant $\sum \text{net\_balance} = 0$ is preserved before, during, and after edits.
  * Preserves `expense.id` and emits an `expense_updated` activity event.

---

## 3. Expense Delete Semantics
* **Hard/Cascade Clean Deletion**: Deleting an expense removes the expense entity and cleans up all associated `ExpenseSplit` records.
* **No Orphan Artifacts**: No orphaned splits or phantom debts remain.
* **Dynamic Rebalance**: Balances and simplified debt graph immediately reflect the removal of the expense.
* **Entity Protection**: Deleting an expense preserves all `Participant` records, unrelated `Transfer` records, unrelated `Income` records, and historical `Settlement` records.
* **Audit Trail**: Emits an `expense_deleted` activity event documenting the deletion.

---

## 4. Transfer Edit & Delete Semantics
* **Transfer Edit**:
  * Modifies `amount_cents`, `sender_participant_id`, `receiver_participant_id`, and `notes`.
  * Preserves `transfer.id`.
  * Verifies sender $\neq$ receiver and both belong to the Serrucho.
  * Recalculates debtor/creditor balances dynamically.
* **Transfer Delete**:
  * Deletes the transfer record from the store.
  * Reverses the debt clearance, restoring the corresponding unpaid balance to the debtor and creditor.
  * Emits `transfer_deleted` activity event.
* **Classification**: **PARITY IMPLEMENTED** (Kittysplit confirms transfer/settlement transactions; independent edit/delete lifecycle operations are fully implemented in Serrucho).

---

## 5. Income Edit & Delete Semantics
* **Income Edit**:
  * Modifies `amount_cents`, `received_by_participant_id`, `description`, and `splits` (`IncomeParticipant[]`).
  * Preserves `income.id` and updates recipient credits.
  * Preserves $\sum \text{split.credit\_cents} = \text{income.amount\_cents}$.
* **Income Delete**:
  * Removes income record and associated income splits.
  * Recalculates beneficiary credits and net balances dynamically.
  * Emits `income_deleted` activity event.
* **Classification**: **SERRUCHO ADAPTATION** (Kittysplit does not provide a dedicated multi-participant Income subsystem).

---

## 6. Settlement Interactions
* **Scenario: Expense Deleted After Settlement**:
  * When an expense is settled via a `Transfer` (e.g. Maria pays Juan $500 to settle debt from a $1,000 expense) and the original expense is subsequently edited or deleted:
  * The `Transfer` record represents a real-world completed historical payment between Maria and Juan.
  * The transfer remains persisted.
  * Balances recompute strictly from ground truth: Maria is now credited +$500 and Juan owes $500 (or Maria's balance is adjusted accordingly).
  * No database crash or orphaned state occurs; the simplified debt engine (`simplifyDebts`) reflects the new net position accurately.

---

## 7. Activity / Audit History Architecture
* **Audit Log Engine**: `ActivityService` / `ActivityLog` records structured audit entries:
  ```typescript
  export interface ActivityLog {
    id: string;
    serrucho_id: string;
    actor_participant_id?: string | null;
    actor_user_id?: string | null;
    event_type: 'expense_created' | 'expense_updated' | 'expense_deleted'
              | 'transfer_created' | 'transfer_updated' | 'transfer_deleted'
              | 'income_created' | 'income_updated' | 'income_deleted'
              | 'participant_added' | 'participant_updated' | 'participant_deleted'
              | 'serrucho_closed' | 'serrucho_reopened';
    entity_type: 'expense' | 'transfer' | 'income' | 'participant' | 'serrucho';
    entity_id: string;
    metadata?: Record<string, any>;
    created_at: string;
  }
  ```
* **Actor Identity**: Decouples participant identity (`actor_participant_id`) from authenticated Supabase user (`actor_user_id`), accommodating Guest mode.
* **Privacy & Security**: Never records secret tokens, passwords, or payment credentials.
* **Classification**:
  * **Activity Feed (UI Timeline)**: **SERRUCHO ADAPTATION** (Provides chronological event stream to users).
  * **ActivityLog (Structured Audit DB)**: **SERRUCHO ADAPTATION** (Deep database audit logging with actor decoupling).

---

## 8. Authorization & Server-Side Validation
* All mutations (update, delete) validate server-side:
  1. `serrucho_id` matches the entity's Serrucho.
  2. All referenced participant IDs belong to the specified Serrucho.
  3. Serrucho status is `ACTIVE` (not `CLOSED`).
  4. Entity ID exists and is properly formatted.
* UI disabling is treated as cosmetic; backend repositories strictly enforce these rules.

---

## 9. Closed Serrucho Behavior
* When `serrucho.status === 'CLOSED'`:
  * `ExpenseService.update` $\rightarrow$ Throws `"No se pueden modificar gastos en un Serrucho cerrado"`
  * `ExpenseService.delete` $\rightarrow$ Throws `"No se pueden eliminar gastos en un Serrucho cerrado"`
  * `TransferService.update` $\rightarrow$ Throws `"No se pueden modificar transferencias en un Serrucho cerrado"`
  * `TransferService.delete` $\rightarrow$ Throws `"No se pueden eliminar transferencias en un Serrucho cerrado"`
  * `IncomeService.update` $\rightarrow$ Throws `"No se pueden modificar ingresos en un Serrucho cerrado"`
  * `IncomeService.delete` $\rightarrow$ Throws `"No se pueden eliminar ingresos en un Serrucho cerrado"`

---

## 10. Atomicity & Concurrency
* **Atomic Batching**: Multi-table updates (Expense + Splits, Income + Splits) execute within single transactional boundaries or atomic memory updates.
* **Idempotency**: Rapid repeat requests (e.g. double-click delete or retry) handle idempotent deletion gracefully without creating ghost records or crashing.

---

## 11. Offline Behavior
* Web and Mobile cache transactions locally in `localStorage` and `AsyncStorage`.
* When an edit or deletion occurs offline, the local queue marks the mutation and reconciles with the backend upon network reconnection.

---

## 12. Web & Mobile Parity
* Both `@serrucho/web` and `@serrucho/mobile` consume `@serrucho/core` services (`ExpenseService`, `TransferService`, `IncomeService`, `calculateParticipantBalances`, `simplifyDebts`).
* Financial outcomes across web browsers and mobile devices are mathematically identical.

---

## 13. Reused Code
* `@serrucho/core`: `ExpenseService`, `TransferService`, `IncomeService`, `ActivityService`, `calculateParticipantBalances`, `calculateNetBalances`, `simplifyDebts`, `formatDOP`.
* `@serrucho/supabase`: `SupabaseSerruchoRepository`, `MemorySerruchoRepository`.
* `@serrucho/web`: `TransactionDetailModal`, `EditExpenseModal`, `DeleteConfirmationDialog`, `ActivityFeed`.
* `@serrucho/mobile`: `ExpenseDetailScreen`, `EditExpenseScreen`, `ActivityScreen`.

---

## 14. Documentation of Test Modification (BAL-08)
* **Context**: In `apps/web/tests/unit/ser-kitty-004-balances-settlement.test.ts`, test case `BAL-08` verifies integer cent preservation when dividing 10,000 cents ($100.00 DOP) equally among 3 participants (Juan, Maria, Pedro), paid by Juan.
* **Calculation Details**:
  * Total Expense: 10,000 cents.
  * Equal division across 3 participants: $\lfloor 10000 / 3 \rfloor = 3333$ cents, with the 1 remainder cent allocated to the first participant in `splits` (Juan: $3334$ cents; Maria: $3333$ cents; Pedro: $3333$ cents $\rightarrow \sum = 10000$ cents).
  * Juan paid: 10,000 cents; Juan owed: 3,334 cents $\rightarrow$ Juan net balance: $+6,666$ cents.
  * Maria owed: 3,333 cents; paid 0 $\rightarrow$ Maria net balance: $-3,333$ cents.
  * Pedro owed: 3,333 cents; paid 0 $\rightarrow$ Pedro net balance: $-3,333$ cents.
  * $\sum \text{net\_balances} = +6666 - 3333 - 3333 = 0$ cents (INV-01 satisfied).
* **Transfer Volume**:
  * Debt simplification (`simplifyDebts`) creates two settlements:
    1. Maria $\rightarrow$ Juan for 3,333 cents.
    2. Pedro $\rightarrow$ Juan for 3,333 cents.
  * Total settlement transfer volume $= 3333 + 3333 = 6,666$ cents (RD$ 66.66).
* **Verification**: `expect(totalTransferCents).toBe(6666)` correctly matches the deterministic remainder distribution of the integer cent split engine without precision loss.

---

## 15. Deleted Code
* Itemized Split: 100% eliminated from runtime code, zero remnants.

---

## 16. UNKNOWN
* None. All transaction modification, deletion, split replacement, and activity log mechanics have been fully audited and verified.

---

## 17. DEFERRED
* Full event-sourcing / multi-level git-like undo stack (Kittysplit operates on standard CRUD with audit logs rather than continuous event sourcing).

---

## 18. Kittysplit Parity Classification (Evidence-Based)

| Feature / Dimension | Kittysplit Behavior | Serrucho Implementation | Classification | Evidence & Rationale |
|---|---|---|---|---|
| **Expense Edit** | Edit amount, concept, payer, participants | `ExpenseService.update` with ID stability and dynamic recalculation | **PARITY VERIFIED** | Kittysplit allows modifying expense details in place without destroying history. |
| **Split Replacement** | Splits replaced cleanly on ratio change | Atomic split replacement in repository | **PARITY VERIFIED** | Replaces old splits atomically without duplicate debts. |
| **Expense Delete** | Deletes expense and updates balances | Clean delete with split cascade & rebalancing | **PARITY VERIFIED** | Removes obligation completely from persistent ground truth. |
| **Split Methods (Equal, Exact, Shares)** | Equal, Fixed/Set Amount, Shares | Supported natively in core engine | **PARITY VERIFIED** | Documented in Kittysplit official specifications. |
| **Split Method (Percentage)** | Not documented in core Kittysplit spec | Supported in Serrucho engine | **SERRUCHO ADAPTATION** | Preserved from existing implementation as an adaptation. |
| **Transfer (Settlement Transaction)** | Record settlement payment between 2 members | `TransferService.add` | **PARITY VERIFIED** | Kittysplit natively treats settlements as payments between 2 participants. |
| **Transfer Edit / Delete** | Edit/delete behavior not fully documented in native spec | `TransferService.update`, `delete` with balance restoration | **PARITY IMPLEMENTED** | Implemented cleanly in Serrucho with full balance restoration. |
| **Income Subsystem** | Modeled as negative expenses or payments | Dedicated `Income` & `IncomeSplit` model (`IncomeService`) | **SERRUCHO ADAPTATION** | Kittysplit lacks dedicated multi-participant income splitting; this is a Serrucho extension. |
| **Activity Feed (UI Timeline)** | Not documented as equivalent chronological feed | Group activity timeline rendering recent events | **SERRUCHO ADAPTATION** | Timeline of actions provided for group visibility. |
| **ActivityLog (Structured Audit DB)** | Not documented as structured audit database | Structured database table with metadata diffs & actor decoupling | **SERRUCHO ADAPTATION** | Granular database auditing with guest/account decoupling is a Serrucho backend enhancement. |
| **Closed Group Lock** | Immutability on closed groups | Server-side status checks blocking all mutations | **PARITY VERIFIED** | Prevents modifying closed/settled groups. |
| **Dominican Currency & Notes** | N/A | DOP cents integrity & WhatsApp payment context | **SERRUCHO ADAPTATION** | Localized adaptation for Dominican Republic. |

---
