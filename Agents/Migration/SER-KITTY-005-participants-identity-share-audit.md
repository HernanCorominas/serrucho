# AUDIT ARTIFACT: SER-KITTY-005 — Participants, Identity ("Who are you?") & Share

> **Milestone / Prompt**: PROMPT 05 — PARTICIPANTS + IDENTITY ("WHO ARE YOU?") + SHARE  
> **Status**: COMPLETED & VERIFIED  
> **Scope**: Participant CRUD, Stable IDs, "Who are you?" Identity Model, Secret Share Links, Dominican WhatsApp Deep Links, Web & Mobile Parity, Security Guards  
> **Date**: 2026-09-06

---

## 1. Existing Participant Architecture
* **Domain Model**:
  ```typescript
  export interface Participant {
    id: string;
    serrucho_id: string;
    name: string;
    email: string | null;
    phone?: string | null;
    preferred_channel?: NotificationChannel;
    default_shares?: number;
    user_id?: string | null;
    access_status?: ParticipantAccessStatus;
    last_seen_at?: string | null;
    created_at: string;
    updated_at: string;
  }
  ```
* **ID Stability**: Renaming a participant via `ParticipantService.update(id, { name })` updates the `name` column and `updated_at` while keeping `id` immutable. This guarantees that foreign key references across `Expense.paid_by_participant_id`, `ExpenseSplit.participant_id`, `Transfer.sender_participant_id`, `Transfer.receiver_participant_id`, and `IncomeSplit.participant_id` remain strictly intact.
* **Deletion Guard**: `ParticipantService.delete(id)` enforces pre-deletion integrity. If the participant has paid any expense or owes money in any active expense split, deletion is blocked with a domain validation error.

---

## 2. Existing Identity Architecture ("Who are you?")
* **Philosophy**: Strict adherence to the Kittysplit guest model.
  * **No Auto-Identification**: The system does NOT assume "You are the creator" or bind the first participant in the array to the browser session.
  * **Explicit Selection**: Upon first access to a Serrucho (`/dashboard/[id]` or `/join/[token]`), the user sees the list of participants and explicitly selects their name.
  * **Local Memory Persistence**: The association `serrucho_my_id_${serruchoId} -> participantId` is stored in client storage (`localStorage` on Web, `AsyncStorage` on Mobile).
  * **Identity Switching**: Users can change their identity ("Ver todo el grupo" or pick another participant) without mutating any financial state, expenses, splits, or balances.
  * **Invalid Stored Identity Fallback**: If a locally stored participant ID no longer exists (e.g. participant was deleted), the application resets identity to `null` and prompts reselection.

---

## 3. Existing Share Architecture
* **Secret Link Mechanics**:
  * **Edit Link**: `/dashboard/[id]` or `/k/[id]` allows members to record expenses, abonar transfers, and select identity.
  * **Read-Only Link**: `/r/[read_only_token]` provides a view-only view of expenses, balances, and simplified settlements while disabling mutation buttons and API writes.
  * **Public Settlement Receipt**: `/s/[token]` displays individual settlement receipts for debtors/creditors with Dominican payment instructions.
* **Social & WhatsApp Sharing**:
  * Formatted invitation strings (`generateSerruchoInviteMessage`) with group name, organizer name, and direct URL.
  * `buildWhatsAppShareUrl` utilizes `encodeURIComponent` to support emojis (🌴, 🇩🇴), spaces, accents, and special characters safely without leaking passwords or backend secrets.

---

## 4. Kittysplit Parity Comparison

| Dimension | Kittysplit Behavior | Serrucho Implementation | Classification |
|---|---|---|---|
| **Participant Creation** | Free creation during/after group setup, no account needed | `ParticipantService.add` supports guest participant creation | **PARITY VERIFIED** |
| **Participant Renaming** | Stable ID preserved, name updated | `ParticipantService.update` preserves ID, updates name | **PARITY VERIFIED** |
| **Participant Deletion** | Safe deletion when no financial ties exist | Blocked if participant has expenses or split debts | **PARITY VERIFIED** |
| **"Who are you?" Prompt** | Explicit picker on first access | Explicit modal/selector, no auto-assignment | **PARITY VERIFIED** |
| **Identity Persistence** | Stored in local browser memory | `localStorage` / `AsyncStorage` per Serrucho ID | **PARITY VERIFIED** |
| **Identity Switching** | Allows switching identity anytime | Switcher in header/dashboard, zero financial effect | **PARITY VERIFIED** |
| **Share via Link** | Secret link grants group access | Tokenized `/dashboard/[id]` and `/r/[token]` | **PARITY VERIFIED** |
| **Dominican WhatsApp** | N/A (Standard link sharing) | `wa.me` deep links with URL-encoded messages & DOP | **SERRUCHO ADAPTATION** |

---

## 5. Web Behavior
* **Join Token Flow (`/join/[token]`)**: Displays group metadata and all participants. Members tap their name ("Soy yo") to persist local identity and route to dashboard.
* **Dashboard Header (`/dashboard/[id]`)**: Shows "Viendo como: [Nombre]" pill with option to switch identity or view as guest ("Ver todo el grupo").
* **Share Dialog**: Modal with Colaborador (Edit), Solo Lectura (Read-only), WhatsApp 1-click button, copy-to-clipboard input, and dynamic QR Code.

---

## 6. Mobile Behavior (`apps/mobile`)
* **Identity Modal**: Prompt on first load asking "¿Quién eres?", persisted via `mobileStorage.setMyIdentity(id, pId)`.
* **Participant Management**: Add, edit name, and safe delete in the "Ajustes / Participantes" tab.
* **WhatsApp Share**: Native WhatsApp deep linking and native iOS/Android share sheet.

---

## 7. Persistence
* **Web**: `localStorage.getItem('serrucho_my_id_' + serruchoId)`.
* **Mobile**: `AsyncStorage` key `@serrucho:my_id:${serruchoId}`.
* **Backend Database**: Supabase PostgreSQL / `MemorySerruchoRepository` stores participant records with stable UUIDs.

---

## 8. Security & Adversarial Analysis
* **Cross-Serrucho Rejection**: Rejects foreign participant IDs in expenses, transfers, and incomes (`SEC-01`, `SEC-02`).
* **Token Injection Resilience**: SQL/script injections in read-only and settlement tokens return `null` safely (`SEC-03`).
* **Closed Serrucho Immutability**: All participant mutations (add, update, delete) are strictly rejected once a Serrucho is closed (`SEC-05`).

---

## 9. Offline Behavior
* Offline cache in `mobileStorage` and `useRecentSerruchos` allows viewing participants and identity without active internet connectivity. Changes synchronize upon reconnection.

---

## 10. Reused Code
* `@serrucho/core`: `generateSerruchoInviteMessage`, `buildWhatsAppShareUrl`, `calculateParticipantBalances`, `simplifyDebts`.
* `ParticipantService`, `ExpenseService`, `TransferService`, `IncomeService`, `SettlementService`.
* `ShareSerruchoDialog`, `ParticipantList`, `AddParticipantDialog`.

---

## 11. Modified Code
* `apps/web/tests/unit/ser-kitty-005-participants-identity-share.test.ts`: Added 30 unit tests covering all matrix requirements (`PAR-01..10`, `ID-01..08`, `SH-01..07`, `SEC-01..05`).

---

## 12. Deleted Code
* None. Zero destructive code removals.

---

## 13. UNKNOWN Items
* **None**. All requirements for participant management, identity resolution, and share link generation are fully established with concrete implementations and tests.

---

## 14. DEFERRED Items
* **None**. All Prompt 05 objectives are fully implemented and verified.

---

## 15. Parity Classification
* **Overall Classification**: **PARITY VERIFIED** (with explicitly documented Dominican adaptations for WhatsApp and DOP currency).
