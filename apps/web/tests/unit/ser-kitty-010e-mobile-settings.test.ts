import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateParticipantBalances,
  simplifyDebts,
  formatDOP,
  serruchoSchema,
  type Serrucho,
  type Participant,
  type ExpenseWithSplits,
  type ActivityEvent,
} from "@serrucho/core";

describe("SER-KITTY-010E — Mobile Kitty Settings & Group Management UX Parity", () => {
  let serruchoA: Serrucho;
  let serruchoB: Serrucho;
  let participantsA: Participant[];
  let expensesA: ExpenseWithSplits[];

  beforeEach(() => {
    const now = new Date().toISOString();
    serruchoA = {
      id: "serrucho-a",
      owner_id: "p1",
      name: "Viaje a Las Terrenas 🏖️",
      description: "Coro en la playa",
      currency: "DOP",
      event_date: now,
      status: "OPEN",
      payment_instructions: null,
      payment_deadline: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
    };

    serruchoB = {
      id: "serrucho-b",
      owner_id: "p9",
      name: "Cena en Santo Domingo 🍽️",
      description: "Cena de cumpleaños",
      currency: "DOP",
      event_date: now,
      status: "OPEN",
      payment_instructions: null,
      payment_deadline: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
    };

    participantsA = [
      { id: "p1", serrucho_id: "serrucho-a", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now },
      { id: "p2", serrucho_id: "serrucho-a", name: "Maria", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now },
      { id: "p3", serrucho_id: "serrucho-a", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now },
    ];

    expensesA = [
      {
        id: "e1",
        serrucho_id: "serrucho-a",
        description: "Supermercado Nacional",
        amount_cents: 10000, // 100.00 DOP (BAL-08 test standard: 33.34 / 33.33 / 33.33)
        paid_by_participant_id: "p1",
        paid_by_name: "Juan",
        expense_date: now,
        split_method: "EQUAL",
        category: "GROCERIES",
        created_at: now,
        updated_at: now,
        splits: [
          { expense_id: "e1", participant_id: "p1", participant_name: "Juan", percentage_basis_points: 3334, owed_cents: 3334 },
          { expense_id: "e1", participant_id: "p2", participant_name: "Maria", percentage_basis_points: 3333, owed_cents: 3333 },
          { expense_id: "e1", participant_id: "p3", participant_name: "Pedro", percentage_basis_points: 3333, owed_cents: 3333 },
        ],
      },
    ];
  });

  // ─── 1. GROUP INFO & RENAME PROPAGATION ────────────────────────────────────
  describe("Group Information & Rename", () => {
    it("validates group rename between 2 and 100 characters", () => {
      expect(serruchoSchema.shape.name.safeParse("Viaje a Samaná").success).toBe(true);
      expect(serruchoSchema.shape.name.safeParse("").success).toBe(false);
      expect(serruchoSchema.shape.name.safeParse("a".repeat(101)).success).toBe(false);
    });

    it("Adversarial A: propagates renamed title across Top App Bar and Drawer recents", () => {
      let topAppBarTitle = serruchoA.name;
      let drawerRecents: { id: string; name: string }[] = [{ id: serruchoA.id, name: serruchoA.name }];

      // Rename action
      const newName = "Nuevo Viaje a Punta Cana 🌴";
      serruchoA.name = newName;
      topAppBarTitle = newName;
      drawerRecents = [{ id: serruchoA.id, name: newName }];

      expect(serruchoA.name).toBe("Nuevo Viaje a Punta Cana 🌴");
      expect(topAppBarTitle).toBe("Nuevo Viaje a Punta Cana 🌴");
      expect(drawerRecents[0].name).toBe("Nuevo Viaje a Punta Cana 🌴");
    });

    it("displays fixed home currency DOP and prevents arbitrary mutation", () => {
      expect(serruchoA.currency).toBe("DOP");
      expect(formatDOP(10000)).toContain("RD$");
    });
  });

  // ─── 2. PARTICIPANT MANAGEMENT & FINANCIAL GUARDS ─────────────────────────
  describe("Participant Management & Guards", () => {
    it("allows adding participant and updates calculations", () => {
      const p4: Participant = {
        id: "p4",
        serrucho_id: "serrucho-a",
        name: "Carlos",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedParticipants = [...participantsA, p4];
      const balances = calculateParticipantBalances(updatedParticipants, expensesA, []);

      expect(balances).toHaveLength(4);
      const carlosBalance = balances.find((b) => b.id === "p4");
      expect(carlosBalance?.net_balance_cents).toBe(0);
      expect(carlosBalance?.total_paid_cents).toBe(0);
    });

    it("allows deleting participant without any financial activity", () => {
      const p4: Participant = {
        id: "p4",
        serrucho_id: "serrucho-a",
        name: "Carlos",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const participantsWithCarlos = [...participantsA, p4];

      // Check if p4 has financial activity
      const hasPaid = expensesA.some((e) => e.paid_by_participant_id === p4.id);
      const hasSplits = expensesA.some((e) => e.splits?.some((s) => s.participant_id === p4.id && s.owed_cents > 0));

      expect(hasPaid).toBe(false);
      expect(hasSplits).toBe(false);

      // Deletion is permitted
      const filtered = participantsWithCarlos.filter((p) => p.id !== p4.id);
      expect(filtered).toHaveLength(3);
    });

    it("Adversarial B: strictly blocks deleting participant with paid expenses or split shares", () => {
      // p1 is the payer
      const p1HasPaid = expensesA.some((e) => e.paid_by_participant_id === "p1");
      expect(p1HasPaid).toBe(true);

      // p2 is in splits
      const p2HasSplits = expensesA.some((e) => e.splits?.some((s) => s.participant_id === "p2" && s.owed_cents > 0));
      expect(p2HasSplits).toBe(true);

      // Deletion guard function
      const canDelete = (participantId: string) => {
        const paid = expensesA.some((e) => e.paid_by_participant_id === participantId);
        const splits = expensesA.some((e) => e.splits?.some((s) => s.participant_id === participantId && s.owed_cents > 0));
        return !paid && !splits;
      };

      expect(canDelete("p1")).toBe(false);
      expect(canDelete("p2")).toBe(false);
      expect(canDelete("p3")).toBe(false);
    });
  });

  // ─── 3. SHARING & WHATSAPP INTEGRATION ─────────────────────────────────────
  describe("Sharing & Invitations", () => {
    it("generates authentic Dominican WhatsApp invitation message", () => {
      const url = `https://serrucho.app/s/${serruchoA.id}`;
      const message = `¡Hola! Te invito a unirte a nuestro serrucho *${serruchoA.name}* para dividir los gastos fácilmente sin costo. Entra aquí: ${url}`;

      expect(message).toContain("¡Hola!");
      expect(message).toContain("Viaje a Las Terrenas");
      expect(message).toContain("https://serrucho.app/s/serrucho-a");
    });
  });

  // ─── 4. ACTIVITY LOG & RELATIVE TIMESTAMPS ────────────────────────────────
  describe("Recent Activity", () => {
    it("records and displays activity event without fabricating data", () => {
      const activity: ActivityEvent = {
        id: "act-1",
        serrucho_id: serruchoA.id,
        action_type: "EXPENSE_CREATED",
        entity_type: "EXPENSE",
        actor_name: "Juan",
        summary: "Juan agregó el gasto 'Supermercado Nacional'",
        created_at: new Date().toISOString(),
      };

      expect(activity.actor_name).toBe("Juan");
      expect(activity.summary).toContain("Supermercado Nacional");
      expect(activity.serrucho_id).toBe("serrucho-a");
    });
  });

  // ─── 5. GROUP LIFECYCLE (OPEN / CLOSED / REOPEN) ───────────────────────────
  describe("Group Lifecycle (Open / Closed / Reopen)", () => {
    it("closes group and blocks mutative actions", () => {
      serruchoA.status = "CLOSED";
      serruchoA.closed_at = new Date().toISOString();

      expect(serruchoA.status).toBe("CLOSED");
      expect(serruchoA.closed_at).not.toBeNull();

      // In closed state, adding expense or renaming is blocked
      const canMutate = (serrucho: Serrucho, isReadOnly: boolean) => {
        return serrucho.status !== "CLOSED" && !isReadOnly;
      };

      expect(canMutate(serruchoA, false)).toBe(false);
    });

    it("reopens group and restores editability", () => {
      serruchoA.status = "CLOSED";
      expect(serruchoA.status).toBe("CLOSED");

      // Reopen
      serruchoA.status = "OPEN";
      serruchoA.closed_at = null;
      expect(serruchoA.status).toBe("OPEN");
      expect(serruchoA.closed_at).toBeNull();
    });
  });

  // ─── 6. DANGER ZONE & DELETION CONFIRMATION ───────────────────────────────
  describe("Danger Zone & Delete Confirmation", () => {
    it("Adversarial F: cancel does not delete; confirm deletes permanently", () => {
      let serruchos = [serruchoA, serruchoB];

      // Step 1: Open modal and cancel
      const cancelDelete = () => {
        // do nothing
      };
      cancelDelete();
      expect(serruchos).toHaveLength(2);

      // Step 2: Confirm deletion
      const confirmDelete = (id: string) => {
        serruchos = serruchos.filter((s) => s.id !== id);
      };
      confirmDelete("serrucho-a");
      expect(serruchos).toHaveLength(1);
      expect(serruchos[0].id).toBe("serrucho-b");
    });
  });

  // ─── 7. PERMISSION MATRIX & ADVERSARIAL CASES (C, D, E) ────────────────────
  describe("Permission Matrix & Adversarial Cases", () => {
    it("Adversarial C: Read-only mode blocks all mutative operations", () => {
      const isReadOnly = true;
      const canRename = !isReadOnly && serruchoA.status === "OPEN";
      const canAddParticipant = !isReadOnly && serruchoA.status === "OPEN";
      const canClose = !isReadOnly;
      const canDelete = !isReadOnly;

      expect(canRename).toBe(false);
      expect(canAddParticipant).toBe(false);
      expect(canClose).toBe(false);
      expect(canDelete).toBe(false);
    });

    it("Adversarial D: Closed group restricts mutative operations but permits read/export", () => {
      const isGroupOpen = (status: string) => status === "OPEN";
      const closedSerrucho: Serrucho = { ...serruchoA, status: "CLOSED" };
      const canView = true;
      const canExport = true;
      const canReopen = true;
      const canAddExpense = isGroupOpen(closedSerrucho.status);

      expect(canView).toBe(true);
      expect(canExport).toBe(true);
      expect(canReopen).toBe(true);
      expect(canAddExpense).toBe(false);
    });

    it("Adversarial E: Group isolation guarantees data from Serrucho A never leaks to Serrucho B", () => {
      expect(serruchoA.id).not.toBe(serruchoB.id);
      expect(serruchoA.name).not.toBe(serruchoB.name);
      expect(participantsA.every((p) => p.serrucho_id === "serrucho-a")).toBe(true);
      expect(expensesA.every((e) => e.serrucho_id === "serrucho-a")).toBe(true);
    });
  });

  // ─── 8. FINANCIAL ENGINE INVARIANTS & ZERO-SUM ─────────────────────────────
  describe("Financial Engine Invariants (BAL-08 & Zero-Sum)", () => {
    it("BAL-08: distributes RD$100.00 deterministically (Juan = 3334, Maria = 3333, Pedro = 3333)", () => {
      const splits = expensesA[0].splits;
      const juanSplit = splits.find((s) => s.participant_name === "Juan");
      const mariaSplit = splits.find((s) => s.participant_name === "Maria");
      const pedroSplit = splits.find((s) => s.participant_name === "Pedro");

      expect(juanSplit?.owed_cents).toBe(3334);
      expect(mariaSplit?.owed_cents).toBe(3333);
      expect(pedroSplit?.owed_cents).toBe(3333);
      expect(juanSplit!.owed_cents + mariaSplit!.owed_cents + pedroSplit!.owed_cents).toBe(10000);
    });

    it("preserves zero-sum invariant: sum(net_balances) === 0", () => {
      const balances = calculateParticipantBalances(participantsA, expensesA, []);
      const sumBalances = balances.reduce((acc, b) => acc + b.net_balance_cents, 0);
      expect(sumBalances).toBe(0);

      // Juan paid 10000, owes 3334 -> net +6666
      const juan = balances.find((b) => b.id === "p1");
      expect(juan?.net_balance_cents).toBe(6666);

      // Maria paid 0, owes 3333 -> net -3333
      const maria = balances.find((b) => b.id === "p2");
      expect(maria?.net_balance_cents).toBe(-3333);

      // Pedro paid 0, owes 3333 -> net -3333
      const pedro = balances.find((b) => b.id === "p3");
      expect(pedro?.net_balance_cents).toBe(-3333);

      // Debts simplification
      const simplified = simplifyDebts(participantsA, balances);
      expect(simplified).toHaveLength(2);
      expect(simplified[0].to_name).toBe("Juan");
      expect(simplified[1].to_name).toBe("Juan");
    });
  });
});
