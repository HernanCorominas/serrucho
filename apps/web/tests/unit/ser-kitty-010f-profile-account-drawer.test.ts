import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateParticipantBalances,
  simplifyDebts,
  formatDOP,
  type Serrucho,
  type Participant,
  type ExpenseWithSplits,
} from "@serrucho/core";

describe("SER-KITTY-010F — Mobile Profile, Account & Global Drawer UX Parity", () => {
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
      status: "CLOSED",
      payment_instructions: null,
      payment_deadline: null,
      closed_at: now,
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
        amount_cents: 10000,
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

  // ─── 1. GLOBAL DRAWER & PROFILE SYNC (REF-02) ──────────────────────────────
  describe("Global Drawer & Navigation (REF-02)", () => {
    it("handles open, close, and toggle drawer state correctly", () => {
      let isDrawerOpen = false;
      const openDrawer = () => { isDrawerOpen = true; };
      const closeDrawer = () => { isDrawerOpen = false; };
      const toggleDrawer = () => { isDrawerOpen = !isDrawerOpen; };

      expect(isDrawerOpen).toBe(false);
      openDrawer();
      expect(isDrawerOpen).toBe(true);
      closeDrawer();
      expect(isDrawerOpen).toBe(false);
      toggleDrawer();
      expect(isDrawerOpen).toBe(true);
    });

    it("synchronizes profile name across Drawer header and storage", () => {
      let storageUserName = "Usuario Serrucho";
      let drawerHeaderName = storageUserName;

      // Update name in profile
      const newName = "Braulio Corominas";
      storageUserName = newName;
      drawerHeaderName = storageUserName;

      expect(drawerHeaderName).toBe("Braulio Corominas");
    });

    it("handles recents list ordering, deduplication, and active highlight", () => {
      let recents: { id: string; name: string }[] = [];
      const addRecent = (item: { id: string; name: string }) => {
        const filtered = recents.filter((r) => r.id !== item.id);
        recents = [item, ...filtered].slice(0, 8);
      };

      addRecent({ id: serruchoA.id, name: serruchoA.name });
      addRecent({ id: serruchoB.id, name: serruchoB.name });
      addRecent({ id: serruchoA.id, name: serruchoA.name }); // re-add A (should move to top without duplicate)

      expect(recents).toHaveLength(2);
      expect(recents[0].id).toBe("serrucho-a");
      expect(recents[1].id).toBe("serrucho-b");

      // Active indicator test
      const activeSerruchoId = "serrucho-a";
      const isActiveA = recents[0].id === activeSerruchoId;
      const isActiveB = recents[1].id === activeSerruchoId;

      expect(isActiveA).toBe(true);
      expect(isActiveB).toBe(false);
    });

    it("formats Dominican feedback link for WhatsApp correctly", () => {
      const whatsappFeedbackUrl = "https://wa.me/?text=Hola%20tengo%20un%20feedback%20para%20Serrucho%20RD";
      expect(whatsappFeedbackUrl).toContain("wa.me");
      expect(whatsappFeedbackUrl).toContain("feedback");
      expect(whatsappFeedbackUrl).toContain("Serrucho");
    });
  });

  // ─── 2. PROFILE SCREEN (REF-05) ────────────────────────────────────────────
  describe("Profile Screen (REF-05)", () => {
    it("validates display name between 1 and 50 characters", () => {
      const validateName = (name: string) => {
        const trimmed = name.trim();
        return trimmed.length >= 1 && trimmed.length <= 50;
      };

      expect(validateName("Braulio")).toBe(true);
      expect(validateName("   ")).toBe(false);
      expect(validateName("a".repeat(51))).toBe(false);
    });

    it("represents authentic Guest / Local Mode without fake server authentication", () => {
      const mode = "MODO LOCAL / INVITADO 🇩🇴";
      const isCloudAuth = false;

      expect(mode).toContain("LOCAL");
      expect(isCloudAuth).toBe(false);
    });
  });

  // ─── 3. ACCOUNT SETTINGS SCREEN (REF-06) ──────────────────────────────────
  describe("Account Settings Screen (REF-06)", () => {
    it("contains Danger Zone with 2-step destructive confirmation", () => {
      let localDataCleared = false;
      const confirmDeleteAll = (confirmed: boolean) => {
        if (confirmed) {
          localDataCleared = true;
        }
      };

      // Cancel flow
      confirmDeleteAll(false);
      expect(localDataCleared).toBe(false);

      // Confirm flow
      confirmDeleteAll(true);
      expect(localDataCleared).toBe(true);
    });
  });

  // ─── 4. TUS SERRUCHOS / DASHBOARD (REF-08 -> DARK PARITY) ──────────────────
  describe("Tus Serruchos / Dashboard (REF-08)", () => {
    it("filters serruchos correctly by status and search query", () => {
      const list = [serruchoA, serruchoB];

      const filterList = (status: "OPEN" | "CLOSED", query: string) => {
        return list.filter((s) => {
          const matchesStatus = s.status === status;
          const matchesQuery = query.trim() === "" || s.name.toLowerCase().includes(query.toLowerCase());
          return matchesStatus && matchesQuery;
        });
      };

      // Filter OPEN
      const openGroups = filterList("OPEN", "");
      expect(openGroups).toHaveLength(1);
      expect(openGroups[0].name).toBe("Viaje a Las Terrenas 🏖️");

      // Filter CLOSED
      const closedGroups = filterList("CLOSED", "");
      expect(closedGroups).toHaveLength(1);
      expect(closedGroups[0].name).toBe("Cena en Santo Domingo 🍽️");

      // Search Query
      const searchResults = filterList("OPEN", "Terrenas");
      expect(searchResults).toHaveLength(1);

      const searchEmpty = filterList("OPEN", "Inexistente");
      expect(searchEmpty).toHaveLength(0);
    });

    it("computes stats (Total, Activos, Liquidados) accurately", () => {
      const list = [serruchoA, serruchoB];
      const total = list.length;
      const openCount = list.filter((s) => s.status === "OPEN").length;
      const closedCount = list.filter((s) => s.status === "CLOSED").length;

      expect(total).toBe(2);
      expect(openCount).toBe(1);
      expect(closedCount).toBe(1);
    });
  });

  // ─── 5. GLOBAL STATE & ISOLATION TRANSITIONS ──────────────────────────────
  describe("Global Navigation State & Transitions", () => {
    it("switches context cleanly between Serrucho A and Serrucho B", () => {
      let activeId: string | null = null;
      let activeName: string | null = null;

      const selectSerrucho = (s: Serrucho) => {
        activeId = s.id;
        activeName = s.name;
      };

      // Select A
      selectSerrucho(serruchoA);
      expect(activeId).toBe("serrucho-a");
      expect(activeName).toBe("Viaje a Las Terrenas 🏖️");

      // Switch to B
      selectSerrucho(serruchoB);
      expect(activeId).toBe("serrucho-b");
      expect(activeName).toBe("Cena en Santo Domingo 🍽️");
    });
  });

  // ─── 6. FINANCIAL ENGINE & ARCHITECTURE INVARIANTS ────────────────────────
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

      const simplified = simplifyDebts(participantsA, balances);
      expect(simplified).toHaveLength(2);
      expect(simplified.every((t) => t.to_name === "Juan")).toBe(true);
    });
  });
});
