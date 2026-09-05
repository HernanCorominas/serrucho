import { describe, it, expect } from "vitest";
import { splitByPercentage, simplifyDebts, toCents, fromCents, formatDOP } from "@/lib/finance/math";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { SettlementService } from "@/features/settlements/service";

describe("Viaje Punta Cana — Escenario de Seed y Reglas Financieras", () => {
  it("divides RD$500 expense correctly with 25% and 75% percentages", () => {
    const totalCents = toCents(500); // 50,000 centavos
    const splits = splitByPercentage(totalCents, [
      { participantId: "hernan", basisPoints: 2500 }, // 25.00%
      { participantId: "braulin", basisPoints: 7500 }, // 75.00%
    ]);

    const hernanSplit = splits.find((s) => s.participantId === "hernan")!;
    const braulinSplit = splits.find((s) => s.participantId === "braulin")!;

    expect(hernanSplit.owedCents).toBe(12500); // RD$ 125.00
    expect(braulinSplit.owedCents).toBe(37500); // RD$ 375.00
    expect(hernanSplit.owedCents + braulinSplit.owedCents).toBe(totalCents);
  });

  it("calculates accurate net debt: Braulin owes Hernan RD$375.00", async () => {
    const serrucho = await SerruchoService.create("owner-hernan-id", {
      name: "Viaje Punta Cana",
      currency: "DOP",
      creator_name: "Hernan",
      creator_email: "hernan@ejemplo.do",
      initial_participants: ["Braulin"],
      event_date: "2026-08-27",
    });

    const participants = await ParticipantService.listBySerrucho(serrucho.id);
    const hernan = participants.find((p) => p.name.includes("Hernan"))!;
    const braulin = participants.find((p) => p.name.includes("Braulin"))!;

    expect(hernan).toBeDefined();
    expect(braulin).toBeDefined();

    // Register expense of RD$ 500 paid by Hernan
    await ExpenseService.add(serrucho.id, {
      description: "Picadera y Bebidas Punta Cana",
      amount: 500,
      paid_by_participant_id: hernan.id,
      category: "FOOD_GROCERIES",
      split_method: "PERCENTAGE",
      expense_date: "2026-08-27",
      splits: [
        {
          participant_id: hernan.id,
          percentage: 25,
        },
        {
          participant_id: braulin.id,
          percentage: 75,
        },
      ],
    });

    const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
    const hernanFin = settlement.participants.find((p) => p.id === hernan.id)!;
    const braulinFin = settlement.participants.find((p) => p.id === braulin.id)!;

    // Hernan paid 500, owed 125 -> Net balance = +375
    expect(hernanFin.total_paid_cents).toBe(50000);
    expect(hernanFin.total_owed_cents).toBe(12500);
    expect(hernanFin.net_balance_cents).toBe(37500);

    // Braulin paid 0, owed 375 -> Net balance = -375
    expect(braulinFin.total_paid_cents).toBe(0);
    expect(braulinFin.total_owed_cents).toBe(37500);
    expect(braulinFin.net_balance_cents).toBe(-37500);

    // Simplified Transfers: Braulin -> Hernan: RD$ 375.00
    const transfers = simplifyDebts(settlement.participants, settlement.participants);
    expect(transfers).toHaveLength(1);
    expect(transfers[0].from_name).toContain("Braulin");
    expect(transfers[0].to_name).toContain("Hernan");
    expect(transfers[0].amount_cents).toBe(37500);
    expect(formatDOP(transfers[0].amount_cents)).toContain("375.00");
  });
});
