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

  beforeEach(() => {
    memoryRepo = new MemorySerruchoRepository();
    setRepository(memoryRepo);

    mockEmail = new MockNotificationProvider("EMAIL");
    mockWA = new MockNotificationProvider("WHATSAPP");
    mockRouter = new NotificationRouter(mockEmail, mockWA);
  });

  it("calculates live settlement with accurate balances", async () => {
    // The demo seed has serrucho-demo-1 with Carlos, Juan, Pedro, Maria
    const live = await SettlementService.calculateLiveSettlement("serrucho-demo-1");

    expect(live.totalExpensesCents).toBe(3550000); // 24,000 + 8,500 + 3,000 = 35,500 DOP
    expect(live.participants.length).toBe(4);

    // Sum of net balances must be exactly 0
    const netSum = live.participants.reduce((sum, p) => sum + p.net_balance_cents, 0);
    expect(netSum).toBe(0);
  });

  it("closes a serrucho, creates immutable snapshots and hashes tokens", async () => {
    const closeResult = await SettlementService.closeSerrucho(
      "serrucho-demo-1",
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
    const serrucho = await SerruchoService.getById("serrucho-demo-1");
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
      "serrucho-demo-1",
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
      ParticipantService.add("serrucho-demo-1", {
        name: "Nuevo Amigo",
        email: "nuevo@example.com",
        phone: null,
        preferred_channel: "EMAIL",
      })
    ).rejects.toThrow("No se pueden agregar participantes a un serrucho cerrado");

    // Attempting to add expense must fail
    await expect(
      ExpenseService.add("serrucho-demo-1", {
        description: "Gasto Tarde",
        amount: 500,
        paid_by_participant_id: "part-1",
        expense_date: "2026-08-22",
        split_method: "EQUAL",
        category: "OTHER",
        splits: [{ participant_id: "part-1" }],
      })
    ).rejects.toThrow("No se pueden agregar gastos a un serrucho cerrado");

    // Attempting to close again must fail
    await expect(
      SettlementService.closeSerrucho(
        "serrucho-demo-1",
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
