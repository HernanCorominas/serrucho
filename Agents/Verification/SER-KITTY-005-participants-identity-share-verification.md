# VERIFICATION ARTIFACT: SER-KITTY-005 — Participants, Identity & Share

> **Milestone / Prompt**: PROMPT 05 — PARTICIPANTS + IDENTITY ("WHO ARE YOU?") + SHARE  
> **Status**: PASS / VERIFIED  
> **Date**: 2026-09-06

---

## 1. Automated Tests Summary

```text
Test Suites: 39 passed, 39 total
Tests:       297 passed, 297 total
Snapshots:   0 total
Time:        30.40s
```

### Prompt 05 Discrete Test Matrix (`ser-kitty-005-participants-identity-share.test.ts` — 30/30 Passed)

#### PARTICIPANTS
* `PAR-01`: creates a new participant with valid fields and default shares — **PASS**
* `PAR-02`: renames participant while preserving the exact participant ID — **PASS**
* `PAR-03`: participant appears in Serrucho participant list — **PASS**
* `PAR-04`: participant can be used as the payer of an expense — **PASS**
* `PAR-05`: participant is referenced in expense splits with correct owed amount — **PASS**
* `PAR-06`: participant can be sender or receiver in transfers — **PASS**
* `PAR-07`: participant can be recipient and beneficiary in incomes/refunds — **PASS**
* `PAR-08`: rejects foreign participant ID from another Serrucho in transactions — **PASS**
* `PAR-09`: allows deleting participants with zero records, but BLOCKS if participant has expenses or debts — **PASS**
* `PAR-10`: preserves zero-sum balance invariant after adding, renaming, or deleting participants — **PASS**

#### IDENTITY ("Who are you?")
* `ID-01`: starts without active identity (null) when first accessing Serrucho — **PASS**
* `ID-02`: allows explicit selection of a participant from available options — **PASS**
* `ID-03`: persists selected participant ID in local storage key — **PASS**
* `ID-04`: restores identity on subsequent access using stored local key — **PASS**
* `ID-05`: allows changing identity without affecting participant records or history — **PASS**
* `ID-06`: falls back to reselection if stored participant ID no longer exists in Serrucho — **PASS**
* `ID-07`: selecting or switching identity never modifies financial state or balances — **PASS**
* `ID-08`: does not auto-assign creator as identity on fresh device/session — **PASS**

#### SHARE / INVITE
* `SH-01`: generates valid edit and read-only share URLs — **PASS**
* `SH-02`: valid read-only token opens the correct Serrucho — **PASS**
* `SH-03`: malformed or empty token is rejected safely — **PASS**
* `SH-04`: token from Serrucho A does not grant access to Serrucho B — **PASS**
* `SH-05`: share message contains group name, organizer, and join URL — **PASS**
* `SH-06`: encodes WhatsApp URL with emojis, accents, and special characters safely — **PASS**
* `SH-07`: share copy does not expose user passwords, secret keys, or sensitive internal data — **PASS**

#### SECURITY & ADVERSARIAL
* `SEC-01`: blocks assigning transaction to participant belonging to a different Serrucho — **PASS**
* `SEC-02`: prevents participant mutation across different Serruchos — **PASS**
* `SEC-03`: handles SQL injection and script injection attempts in tokens gracefully — **PASS**
* `SEC-04`: rejects markSeen or identity linking on non-existent participant IDs — **PASS**
* `SEC-05`: rejects adding or updating participants in a closed Serrucho — **PASS**

---

## 2. Typecheck Verification

```bash
npm run typecheck
```
* `@serrucho/core`: `tsc --noEmit` — **0 errors** (PASS)
* `@serrucho/web`: `tsc --noEmit` — **0 errors** (PASS)
* `@serrucho/mobile`: `tsc --noEmit` — **0 errors** (PASS)

---

## 3. Production Build Verification

```bash
npm run build
```
* Turborepo build: **1 successful / 1 total** (PASS)
* Next.js 15.1.6 production output: 13/13 static and dynamic routes compiled without errors.

---

## 4. Manual QA Matrix

| Flow / Scenario | Web Status | Mobile Status | Result |
|---|---|---|---|
| **1. Create group with participants** | PASS | PASS | Participantes creados con nombres correctos e IDs estables. |
| **2. First access "Who are you?" prompt** | PASS | PASS | Sin auto-selección; muestra lista limpia para elegir. |
| **3. Select identity & local persistence** | PASS | PASS | Persistido en `localStorage` / `AsyncStorage`. |
| **4. Reload / Return session** | PASS | PASS | Restaura automáticamente identidad sin repreguntar. |
| **5. Change identity pill/switcher** | PASS | PASS | Cambia a otro participante o vista grupal sin tocar balances. |
| **6. Rename participant** | PASS | PASS | Actualiza nombre preservando ID y referencias a gastos. |
| **7. Attempt delete participant with expenses** | PASS | PASS | Bloqueado con mensaje de advertencia contable. |
| **8. Open Share Dialog** | PASS | PASS | Enlace de edición, enlace de solo lectura y QR funcional. |
| **9. WhatsApp share link click** | PASS | PASS | Abre `wa.me` con mensaje y enlace perfectamente encoded. |
| **10. Join link in incognito session** | PASS | PASS | Abre pantalla "¿Quién eres?" para que el invitado elija su nombre. |

---

## 5. Security & Adversarial Invariants

* **Cross-Serrucho isolation**: Foreign IDs rejected across all mutations.
* **Token injection resistance**: Injections (`' OR '1'='1`, `<script>`) rejected without crashing.
* **Financial Invariant**: $\sum_{i=1}^n \text{net\_balance}_i = 0$ strictly preserved before and after any participant or identity change.
* **Regressions**: **0 regressions** across the 39 test suites.
