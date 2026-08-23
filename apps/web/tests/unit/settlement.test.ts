import { describe, it, expect, beforeEach } from "vitest";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";
import { SettlementService } from "@/features/settlements/service";
import { ExpenseService } from "@/features/expenses/service";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { MockNotificationProvider } from "@/features/notifications/mock-provider";
import { NotificationRouter } from "@/features/notifications/router";

describe("Settlement Service & Lifecycle", () => {
  let memoryRepo: MemorySerruchoRepository;
  let mockRouter: NotificationRouter;
  let mockEmail: MockNotificationProvider;
  let mockWA: MockNotificationProvider;
  let testSerruchoId: string;
  let part1Id: string;
  let part2Id: string;
  let part3Id: string;
  let part4Id: string;

  beforeEach(async () => {
    memoryRepo = new MemorySerruchoRepository();
    setRepository(memoryRepo);

    mockEmail = new MockNotificationProvider("EMAIL");
    mockWA = new MockNotificationProvider("WHATSAPP");
    mockRouter = new NotificationRouter(mockEmail, mockWA);

    // Create fresh test serrucho
    const serrucho = await SerruchoService.create("owner-test", {
      name: "Fin de Semana en Las Terrenas",
      currency: "DOP",
    });
    testSerruchoId = serrucho.id;

    // Add participants
    const p1 = (await ParticipantService.listBySerrucho(testSerruchoId))[0];
    part1Id = p1.id;

    const p2 = await ParticipantService.add(testSerruchoId, {
      name: "Juan Pérez",
      email: "juan@example.com",
      phone: "8095550102",
    });
    part2Id = p2.id;

    const p3 = await ParticipantService.add(testSerruchoId, {
      name: "Pedro Rosario",
      email: "pedro@example.com",
      phone: "8095550103",
      preferred_channel: "WHATSAPP",
    });
    part3Id = p3.id;

    const p4 = await ParticipantService.add(testSerruchoId, {
      name: "María Santos",
      email: "maria@example.com",
      phone: "8095550104",
    });
    part4Id = p4.id;

    const allParts = [p1, p2, p3, p4];

    // Expense 1: Villa (RD$ 24,000) paid by p1
    await ExpenseService.add(testSerruchoId, {
      description: "Alquiler de Villa",
      amount: 24000,
      paid_by_participant_id: p1.id,
      expense_date: "2026-08-20",
      category: "LODGING",
      split_method: "EQUAL",
      splits: allParts.map((p) => ({ participant_id: p.id })),
    });

    // Expense 2: Supermercado (RD$ 8,500) paid by p2
    await ExpenseService.add(testSerruchoId, {
      description: "Supermercado Nacional",
      amount: 8500,
      paid_by_participant_id: p2.id,
      expense_date: "2026-08-21",
      category: "GROCERIES",
      split_method: "EQUAL",
      splits: allParts.map((p) => ({ participant_id: p.id })),
    });

    // Expense 3: Gasolina (RD$ 3,000) paid by p3 (split p1, p2, p3)
    await ExpenseService.add(testSerruchoId, {
      description: "Gasolina y peajes",
      amount: 3000,
      paid_by_participant_id: p3.id,
      expense_date: "2026-08-21",
      category: "GAS_FUEL",
      split_method: "EQUAL",
      splits: [{ participant_id: p1.id }, { participant_id: p2.id }, { participant_id: p3.id }],
    });
  });

  it("calculates live settlement with accurate balances", async () => {
    const live = await SettlementService.calculateLiveSettlement(testSerruchoId);

    expect(live.totalExpensesCents).toBe(3550000); // 24,000 + 8,500 + 3,000 = 35,500 DOP
    expect(live.participants.length).toBe(4);

    // Sum of net balances must be exactly 0
    const netSum = live.participants.reduce((sum, p) => sum + p.net_balance_cents, 0);
    expect(netSum).toBe(0);
  });

  it("closes a serrucho, creates immutable snapshots and hashes tokens", async () => {
    const closeResult = await SettlementService.closeSerrucho(
      testSerruchoId,
      {
        payment_instructions: "Transferencia Banco BHD 1234567890 a Carlos Gómez",
        payment_deadline: "2026-08-30",
        confirm: true,
      },
      "http://localhost:3000",
      mockRouter
    );

    expect(closeResult.snapshots.length).toBe(4);

    // Check serrucho status
    const serrucho = await SerruchoService.getById(testSerruchoId);
    expect(serrucho?.status).toBe("CLOSED");
    expect(serrucho?.closed_at).not.toBeNull();

    // Verify public tokens and URLs are generated
    const firstSnap = closeResult.snapshots[0];
    expect(firstSnap.raw_token).toBeDefined();
    expect(firstSnap.public_url).toContain(`/s/${firstSnap.raw_token}`);

    // Verify public access via raw token
    const publicReceipt = await SettlementService.getPublicSettlement(firstSnap.raw_token);
    expect(publicReceipt).not.toBeNull();
    expect(publicReceipt?.participant.name).toBe(firstSnap.participant_name);
    expect(publicReceipt?.snapshot.payment_instructions).toContain("Banco BHD");

    // Verify invalid token returns null
    const invalidReceipt = await SettlementService.getPublicSettlement("invalid-token-123");
    expect(invalidReceipt).toBeNull();
  });

  it("rejects mutations after serrucho is closed", async () => {
    // Close the serrucho first
    await SettlementService.closeSerrucho(
      testSerruchoId,
      {
        payment_instructions: "Banco BHD",
        payment_deadline: "2026-08-30",
        confirm: true,
      },
      "http://localhost:3000",
      mockRouter
    );

    // Attempting to add participant must fail
    await expect(
      ParticipantService.add(testSerruchoId, {
        name: "Nuevo Amigo",
        email: "nuevo@example.com",
        phone: null,
        preferred_channel: "EMAIL",
      })
    ).rejects.toThrow("No se pueden agregar participantes a un serrucho cerrado");

    // Attempting to add expense must fail
    await expect(
      ExpenseService.add(testSerruchoId, {
        description: "Gasto Tarde",
        amount: 500,
        paid_by_participant_id: part1Id,
        expense_date: "2026-08-22",
        split_method: "EQUAL",
        category: "OTHER",
        splits: [{ participant_id: part1Id }],
      })
    ).rejects.toThrow("No se pueden agregar gastos a un serrucho cerrado");

    // Attempting to close again must fail
    await expect(
      SettlementService.closeSerrucho(
        testSerruchoId,
        {
          payment_instructions: "Banco BHD",
          payment_deadline: "2026-08-30",
          confirm: true,
        },
        "http://localhost:3000",
        mockRouter
      )
    ).rejects.toThrow("Este serrucho ya ha sido cerrado");
  });
});
