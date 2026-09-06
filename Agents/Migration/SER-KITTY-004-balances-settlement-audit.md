# SER-KITTY-004 — Balances & Min-Cash-Flow Settlement Engine Audit

## 1. Existing Balance Engine & Transfer Mathematical Proof
- **Engine Source**: `packages/core/src/finance/math.ts` (`calculateNetBalances`, `simplifyDebts`, `calculateParticipantBalances`).
- **Calculation Formula**: For each participant $i$:
  $$\text{netBalanceCents}_i = \text{totalPaidCents}_i - \text{totalOwedCents}_i$$
  where:
  - $\text{totalPaidCents}_i = \sum \text{expensesPaid}_i + \sum \text{transfersSent}_i$
  - $\text{totalOwedCents}_i = \sum \text{expenseSplitsOwed}_i + \sum \text{transfersReceived}_i$
- **Mathematical Proof (-300 → 0 and +300 → 0)**:
  - **Pre-Settlement State**: Debtor (María) owes 300 cents ($\text{paid} = 0$, $\text{owed} = 300 \implies \text{balance} = 0 - 300 = -300$). Creditor (Juan) is owed 300 cents ($\text{paid} = 300$, $\text{owed} = 0 \implies \text{balance} = 300 - 0 = +300$).
  - **Settlement Event**: María transfers 300 cents to Juan.
  - **Post-Settlement State**:
    - María ($\text{sender}$): $\text{totalPaid} = 0 + 300 = 300$, $\text{totalOwed} = 300 \implies \text{netBalance} = 300 - 300 = 0$.
    - Juan ($\text{receiver}$): $\text{totalPaid} = 300$, $\text{totalOwed} = 0 + 300 = 300 \implies \text{netBalance} = 300 - 300 = 0$.
  - **Ledger Invariant**: Original expenses are never altered or deleted; balances resolve to strictly 0 while conserving $\sum_i \text{netBalanceCents}_i \equiv 0$.

## 2. Existing Settlement Engine
- **Min-Cash-Flow Debt Simplification**: `simplifyDebts(participants, netBalances)` extracts positive (creditors) and negative (debtors) balances, sorts descending by amount with secondary ID sorting for 100% determinism, and executes greedy matching to produce the minimal possible number of peer-to-peer transfers.
- **Settlement Semantics**:
  - Direct distinction between an **Expense** (obligation from a shared cost) and a **Transfer** (debt settlement transaction).
  - Executing a settlement creates a `Transfer` record without destroying, mutating, or deleting the original expenses.
  - Balances dynamically update, eliminating the settled debt from pending suggested transfers.

## 3. Data Model
- `Transfer`: `id`, `serrucho_id`, `sender_participant_id`, `receiver_participant_id`, `amount_cents`, `transfer_date`, `payment_method`, `notes`, `receipt_url`, `created_at`, `updated_at`.
- `ParticipantFinancials`: `id`, `name`, `total_paid_cents`, `total_owed_cents`, `net_balance_cents`.
- All amounts strictly represented in integer cents.

## 4. UI Architecture
- **Web**:
  - `DebtSimplificationCard` (`apps/web/features/settlements/components/debt-simplification-card.tsx`): Displays optimal min-cash-flow transfer cards ("le transfiere a") with 1-click "Saldar" and Dominican WhatsApp direct payment reminders.
  - `MarkSettledDialog` (`apps/web/features/settlements/components/mark-settled-dialog.tsx`): Pre-fills debtor/creditor pair, Dominican payment method selector (Popular, BHD, Banreservas, Qik, etc.), and records the payment.
  - `BalanceOverview` (`apps/web/features/settlements/components/balance-overview.tsx`): Granular table of total paid, total consumed, and net balances with contextual cues.
- **Mobile**:
  - `SerruchoDetailScreen` (`apps/mobile/app/serrucho/[id].tsx`): Tab 2 ("Saldos ⚖️") renders `simplifiedTransfers`, individual balance badges, 1-click "Saldar ✓" dialog, WhatsApp reminder, and recorded settlement transfer history.

## 5. Income Model
- Group incomes (e.g. villa deposit return, supplier refund) are modeled through `Income` and `IncomeSplit`.
- Recipient owes the amount to the group; beneficiaries receive credit in their balance, reducing their net cost.

## 6. Reusable Code
- Reused `calculateNetBalances`, `simplifyDebts`, `calculateParticipantBalances`, `formatDOP`, `toCents`, `fromCents` in `@serrucho/core`.
- Reused `TransferService` in `apps/web/features/transfers/service.ts`.
- Reused `SettlementService` in `apps/web/features/settlements/service.ts`.

## 7. Modified Code
- `packages/core/src/finance/math.ts`: Enhanced `calculateParticipantBalances` to accept optional `transfers` and `incomes`.
- `apps/web/lib/finance/math.ts`: Enhanced `calculateParticipantBalances` to accept optional `transfers` and `incomes`.
- `apps/mobile/src/services/storage.ts`: Added optional `transfers?: Transfer[]` to `saveSerruchoDetail`.
- `apps/mobile/src/components/ui/Card.tsx`: Updated `style?: StyleProp<ViewStyle>` to support compound style arrays.
- `apps/mobile/app/serrucho/[id].tsx`: Replaced temporary expense creation with genuine `Transfer` records and rendered settlement history.

## 8. Deleted Code
- Removed fake expense generation pattern for settlements in mobile client.

## 9. Kittysplit Parity Classification
- **Net Balances Calculation**: PARITY VERIFIED
- **Min-Cash-Flow Debt Simplification**: PARITY VERIFIED
- **Mark as Settled Flow**: PARITY VERIFIED
- **Settlement Persistence (Transfers)**: PARITY VERIFIED
- **Non-Destructive Expense History**: PARITY VERIFIED
- **Partial Settlements**: PARITY VERIFIED (A payment of any amount is registered as a transfer of that amount, reducing the debt by that exact proportion in the live balance engine)
- **Identity Highlight ("Tú debes / Te deben")**: PARITY VERIFIED
- **Zero-Sum Balance Conservation**: PARITY VERIFIED
- **Dominican Payment Methods (BHD, Popular, Banreservas, Qik)**: SERRUCHO ADAPTATION
- **Dominican WhatsApp Collection Deep Links**: SERRUCHO ADAPTATION

## 10. UNKNOWN / DEFERRED
- None.
