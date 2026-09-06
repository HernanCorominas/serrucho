import { describe, it, expect, beforeEach } from "vitest";
import {
  toCents,
  fromCents,
  splitEqually,
  splitByShares,
  splitByExactAmounts,
  calculateNetBalances,
  formatDOP,
} from "@serrucho/core";
import { ExpenseService } from "@/features/expenses/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";

describe("SER-KITTY-003: Canonical Expense Split & Financial Precision Engine", () => {
  let serruchoId: string;
  let pJuanId: string;
  let pMariaId: string;
  let pPedroId: string;
  let pAnaId: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-003", {
      name: "Viaje Punta Cana 2026",
      currency: "DOP",
      creator_name: "Juan",
    });
    serruchoId = serrucho.id;

    // Retrieve creator participant (Juan) and add others
    const participants = await ParticipantService.listBySerrucho(serruchoId);
    pJuanId = participants[0].id;

    const maria = await ParticipantService.add(serruchoId, { name: "María", preferred_channel: "WHATSAPP" });
    const pedro = await ParticipantService.add(serruchoId, { name: "Pedro", preferred_channel: "WHATSAPP" });
    const ana = await ParticipantService.add(serruchoId, { name: "Ana", preferred_channel: "WHATSAPP" });

    pMariaId = maria.id;
    pPedroId = pedro.id;
    pAnaId = ana.id;
  });

  // ==========================================
  // SECTION 1: METHOD 1 — EQUAL SPLIT
  // ==========================================
  describe("Method 1: EQUAL Split", () => {
    it("splits 100 DOP among 2 participants exactly (50.00 each)", () => {
      const totalCents = toCents(100);
      const splits = splitEqually(totalCents, [pJuanId, pMariaId]);
      expect(splits).toHaveLength(2);
      expect(splits[0].owedCents).toBe(5000);
      expect(splits[1].owedCents).toBe(5000);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(totalCents);
    });

    it("splits 100 DOP among 3 participants with deterministic penny allocation (33.34, 33.33, 33.33)", () => {
      const totalCents = toCents(100); // 10000 cents
      const splits = splitEqually(totalCents, [pJuanId, pMariaId, pPedroId]);
      expect(splits).toHaveLength(3);
      const totalAllocated = splits.reduce((sum, s) => sum + s.owedCents, 0);
      expect(totalAllocated).toBe(10000);

      // Verify deterministic penny distribution (1 extra cent to remainder)
      // 10000 % 3 = 1 extra cent
      const highCent = splits.filter((s) => s.owedCents === 3334);
      const standardCent = splits.filter((s) => s.owedCents === 3333);
      expect(highCent).toHaveLength(1);
      expect(standardCent).toHaveLength(2);
    });

    it("splits 1 cent (0.01 DOP) among 3 participants (1, 0, 0 cents)", () => {
      const totalCents = 1;
      const splits = splitEqually(totalCents, [pJuanId, pMariaId, pPedroId]);
      expect(splits).toHaveLength(3);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(1);
      const withCent = splits.filter((s) => s.owedCents === 1);
      const zeroCent = splits.filter((s) => s.owedCents === 0);
      expect(withCent).toHaveLength(1);
      expect(zeroCent).toHaveLength(2);
    });

    it("splits 10,000 DOP among 7 participants with exact remainder distribution", () => {
      const totalCents = toCents(10000); // 1,000,000 cents
      const pIds = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"];
      const splits = splitEqually(totalCents, pIds);
      expect(splits).toHaveLength(7);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(1000000);

      // 1000000 / 7 = 142857 base, remainder = 1 cent
      const highCent = splits.filter((s) => s.owedCents === 142858);
      const standardCent = splits.filter((s) => s.owedCents === 142857);
      expect(highCent).toHaveLength(1);
      expect(standardCent).toHaveLength(6);
    });

    it("handles odd cents (e.g. RD$ 1,234.57 among 3 people)", () => {
      const totalCents = toCents(1234.57); // 123457 cents
      const splits = splitEqually(totalCents, [pJuanId, pMariaId, pPedroId]);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(123457);
      // 123457 % 3 = 1 remainder cent
      expect(splits.filter((s) => s.owedCents === 41153)).toHaveLength(1);
      expect(splits.filter((s) => s.owedCents === 41152)).toHaveLength(2);
    });

    it("handles single participant (100% of amount)", () => {
      const totalCents = toCents(500);
      const splits = splitEqually(totalCents, [pJuanId]);
      expect(splits).toHaveLength(1);
      expect(splits[0].owedCents).toBe(50000);
    });

    it("handles zero participants gracefully", () => {
      const splits = splitEqually(toCents(100), []);
      expect(splits).toEqual([]);
    });
  });

  // ==========================================
  // SECTION 2: METHOD 2 — SHARES SPLIT
  // ==========================================
  describe("Method 2: SHARES (Cuotas) Split", () => {
    it("splits 1:1 correctly", () => {
      const totalCents = toCents(1000);
      const splits = splitByShares(totalCents, [
        { participantId: pJuanId, shares: 1 },
        { participantId: pMariaId, shares: 1 },
      ]);
      expect(splits).toHaveLength(2);
      expect(splits[0].owedCents).toBe(50000);
      expect(splits[1].owedCents).toBe(50000);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(100000);
    });

    it("splits 2:1 correctly (Juan: 2 shares, Maria: 1 share of RD$ 1,000)", () => {
      const totalCents = toCents(1000); // 100,000 cents
      const splits = splitByShares(totalCents, [
        { participantId: pJuanId, shares: 2 },
        { participantId: pMariaId, shares: 1 },
      ]);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(100000);
      const juan = splits.find((s) => s.participantId === pJuanId);
      const maria = splits.find((s) => s.participantId === pMariaId);
      expect(juan?.owedCents).toBe(66667);
      expect(maria?.owedCents).toBe(33333);
    });

    it("splits 2:1:1 correctly (Juan: 2 shares, Maria: 1 share, Pedro: 1 share of RD$ 1,000)", () => {
      const totalCents = toCents(1000);
      const splits = splitByShares(totalCents, [
        { participantId: pJuanId, shares: 2 },
        { participantId: pMariaId, shares: 1 },
        { participantId: pPedroId, shares: 1 },
      ]);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(100000);
      const juan = splits.find((s) => s.participantId === pJuanId);
      const maria = splits.find((s) => s.participantId === pMariaId);
      const pedro = splits.find((s) => s.participantId === pPedroId);
      expect(juan?.owedCents).toBe(50000);
      expect(maria?.owedCents).toBe(25000);
      expect(pedro?.owedCents).toBe(25000);
    });

    it("supports decimal shares without integer truncation (Juan: 1.5, Maria: 1.0, Pedro: 0.5 of RD$ 1,000)", () => {
      const totalCents = toCents(1000); // 100,000 cents, Total shares = 3.0
      const splits = splitByShares(totalCents, [
        { participantId: pJuanId, shares: 1.5 },
        { participantId: pMariaId, shares: 1.0 },
        { participantId: pPedroId, shares: 0.5 },
      ]);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(100000);
      const juan = splits.find((s) => s.participantId === pJuanId);
      const maria = splits.find((s) => s.participantId === pMariaId);
      const pedro = splits.find((s) => s.participantId === pPedroId);
      expect(juan?.owedCents).toBe(50000);
      expect(maria?.owedCents).toBe(33333);
      expect(pedro?.owedCents).toBe(16667);
    });

    it("throws error when total shares is 0 or negative", () => {
      expect(() =>
        splitByShares(toCents(100), [
          { participantId: pJuanId, shares: 0 },
          { participantId: pMariaId, shares: 0 },
        ])
      ).toThrow();

      expect(() =>
        splitByShares(toCents(100), [
          { participantId: pJuanId, shares: -1 },
          { participantId: pMariaId, shares: -2 },
        ])
      ).toThrow();
    });
  });

  // ==========================================
  // SECTION 3: METHOD 3 — FIXED AMOUNT SPLIT
  // ==========================================
  describe("Method 3: FIXED AMOUNT (Montos Exactos) Split", () => {
    it("allocates exact amounts when sum equals total (500 + 300 + 200 = 1000)", () => {
      const totalCents = toCents(1000);
      const splits = splitByExactAmounts(totalCents, [
        { participantId: pJuanId, amountCents: 50000 },
        { participantId: pMariaId, amountCents: 30000 },
        { participantId: pPedroId, amountCents: 20000 },
      ]);
      expect(splits).toHaveLength(3);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(totalCents);
      expect(splits[0].owedCents).toBe(50000);
      expect(splits[1].owedCents).toBe(30000);
      expect(splits[2].owedCents).toBe(20000);
    });

    it("throws error on under-allocation (sum < total)", () => {
      const totalCents = toCents(1000);
      expect(() =>
        splitByExactAmounts(totalCents, [
          { participantId: pJuanId, amountCents: 50000 },
          { participantId: pMariaId, amountCents: 30000 },
          { participantId: pPedroId, amountCents: 10000 }, // sum = 90000 < 100000
        ])
      ).toThrow();
    });

    it("throws error on over-allocation (sum > total)", () => {
      const totalCents = toCents(1000);
      expect(() =>
        splitByExactAmounts(totalCents, [
          { participantId: pJuanId, amountCents: 60000 },
          { participantId: pMariaId, amountCents: 40000 },
          { participantId: pPedroId, amountCents: 10000 }, // sum = 110000 > 100000
        ])
      ).toThrow();
    });

    it("handles single participant fixed amount", () => {
      const totalCents = toCents(450.75);
      const splits = splitByExactAmounts(totalCents, [
        { participantId: pJuanId, amountCents: 45075 },
      ]);
      expect(splits).toHaveLength(1);
      expect(splits[0].owedCents).toBe(45075);
    });
  });

  // ==========================================
  // SECTION 4: PROPERTY-BASED INVARIANT TESTING
  // ==========================================
  describe("Financial Property & Invariant Testing", () => {
    it("INVARIANT 1: sum(splits) === totalCents for arbitrary amounts and participant counts (Equal)", () => {
      const testAmounts = [1, 2, 3, 7, 10, 99, 100, 333, 999, 123456, 99999999];
      const participantCounts = [1, 2, 3, 4, 5, 7, 11, 13, 20];

      for (const amt of testAmounts) {
        for (const count of participantCounts) {
          const pIds = Array.from({ length: count }, (_, i) => `p-${i}`);
          const splits = splitEqually(amt, pIds);
          const sum = splits.reduce((acc, s) => acc + s.owedCents, 0);
          expect(sum).toBe(amt);
        }
      }
    });

    it("INVARIANT 1: sum(splits) === totalCents for arbitrary amounts and shares combinations", () => {
      const testAmounts = [10, 50, 100, 333, 1000, 77777, 500000];
      const shareSets = [
        [1, 1],
        [2, 1],
        [1.5, 0.5],
        [1, 2, 3],
        [0.25, 0.75, 1.5, 2.5],
        [1.1, 2.2, 3.3, 4.4],
      ];

      for (const amt of testAmounts) {
        for (const shares of shareSets) {
          const splitsInput = shares.map((s, idx) => ({
            participantId: `p-${idx}`,
            shares: s,
          }));
          const splits = splitByShares(amt, splitsInput);
          const sum = splits.reduce((acc, s) => acc + s.owedCents, 0);
          expect(sum).toBe(amt);
        }
      }
    });

    it("INVARIANT 2: Net balance sum across all participants equals 0 (Zero-Sum Conservation)", () => {
      const expenses = [
        {
          paidByParticipantId: pJuanId,
          amountCents: 300000,
          splits: splitEqually(300000, [pJuanId, pMariaId, pPedroId]),
        },
        {
          paidByParticipantId: pMariaId,
          amountCents: 150000,
          splits: splitByShares(150000, [
            { participantId: pJuanId, shares: 2 },
            { participantId: pMariaId, shares: 1 },
            { participantId: pPedroId, shares: 1 },
          ]),
        },
        {
          paidByParticipantId: pPedroId,
          amountCents: 60000,
          splits: splitByExactAmounts(60000, [
            { participantId: pJuanId, amountCents: 20000 },
            { participantId: pMariaId, amountCents: 20000 },
            { participantId: pPedroId, amountCents: 20000 },
          ]),
        },
      ];

      const balancesMap = calculateNetBalances(
        [pJuanId, pMariaId, pPedroId],
        expenses.map((e) => ({
          paidByParticipantId: e.paidByParticipantId,
          amountCents: e.amountCents,
          splits: e.splits.map((s) => ({ participantId: s.participantId, owedCents: s.owedCents })),
        }))
      );

      let totalNet = 0;
      for (const summary of balancesMap.values()) {
        totalNet += summary.netBalanceCents;
      }
      expect(totalNet).toBe(0);
    });
  });

  // ==========================================
  // SECTION 5: ADVERSARIAL & EDGE CASE TESTING
  // ==========================================
  describe("Adversarial & Edge Cases (ExpenseService API)", () => {
    it("rejects amount of 0", async () => {
      await expect(
        ExpenseService.add(serruchoId, {
          description: "Gasto Cero",
          amount: 0,
          paid_by_participant_id: pJuanId,
          expense_date: "2026-09-06",
          split_method: "EQUAL",
          splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
        })
      ).rejects.toThrow();
    });

    it("rejects negative amounts", async () => {
      await expect(
        ExpenseService.add(serruchoId, {
          description: "Gasto Negativo",
          amount: -500,
          paid_by_participant_id: pJuanId,
          expense_date: "2026-09-06",
          split_method: "EQUAL",
          splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
        })
      ).rejects.toThrow();
    });

    it("rejects empty description", async () => {
      await expect(
        ExpenseService.add(serruchoId, {
          description: "   ",
          amount: 500,
          paid_by_participant_id: pJuanId,
          expense_date: "2026-09-06",
          split_method: "EQUAL",
          splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
        })
      ).rejects.toThrow();
    });

    it("rejects invalid payer not in Serrucho", async () => {
      await expect(
        ExpenseService.add(serruchoId, {
          description: "Cena",
          amount: 500,
          paid_by_participant_id: "p-impostor",
          expense_date: "2026-09-06",
          split_method: "EQUAL",
          splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
        })
      ).rejects.toThrow(/El pagador no es un participante válido/);
    });

    it("rejects invalid participant in splits not belonging to Serrucho", async () => {
      await expect(
        ExpenseService.add(serruchoId, {
          description: "Cena",
          amount: 500,
          paid_by_participant_id: pJuanId,
          expense_date: "2026-09-06",
          split_method: "EQUAL",
          splits: [{ participant_id: pJuanId }, { participant_id: "p-extranjero" }],
        })
      ).rejects.toThrow(/no pertenece a este serrucho/);
    });

    it("creates, edits, and deletes an expense maintaining full lifecycle integrity", async () => {
      // 1. CREATE
      const created = await ExpenseService.add(serruchoId, {
        description: "Alquiler Villa",
        amount: 3000,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [
          { participant_id: pJuanId },
          { participant_id: pMariaId },
          { participant_id: pPedroId },
        ],
      });

      expect(created.id).toBeDefined();
      expect(created.amount_cents).toBe(300000);
      expect(created.splits).toHaveLength(3);
      expect(created.splits.reduce((sum, s) => sum + s.owed_cents, 0)).toBe(300000);

      // 2. EDIT
      const updated = await ExpenseService.update(created.id, {
        description: "Alquiler Villa Premium",
        amount: 4500,
        split_method: "SHARES",
        splits: [
          { participant_id: pJuanId, shares: 2 },
          { participant_id: pMariaId, shares: 1 },
        ],
      });

      expect(updated.description).toBe("Alquiler Villa Premium");
      expect(updated.amount_cents).toBe(450000);
      expect(updated.splits).toHaveLength(2);
      expect(updated.splits.reduce((sum, s) => sum + s.owed_cents, 0)).toBe(450000);

      // 3. DELETE
      const deleted = await ExpenseService.delete(created.id);
      expect(deleted).toBe(true);

      const remainingExpenses = await ExpenseService.listBySerrucho(serruchoId);
      expect(remainingExpenses.find((e) => e.id === created.id)).toBeUndefined();
    });
  });
});
