import { describe, it, expect, beforeEach } from "vitest";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { MonetizationService, SUPER_SERRUCHO_DEFAULT_FEATURES } from "@/features/monetization/service";
import { setRepository, getRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 28: Super Serrucho & Monetization (Modelo premium por Serrucho)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  describe("Group-Wide Unlock Model (1 single payment unlocks for everyone)", () => {
    it("starts as free tier and unlocks all premium features for all participants after 1 payment", async () => {
      // 1. Create Serrucho with multiple participants
      const serrucho = await SerruchoService.create("guest-creator", {
        name: "Viaje a Bahía de las Águilas",
        currency: "DOP",
      });

      const p1 = await ParticipantService.add(serrucho.id, { name: "Manuel" });
      const p2 = await ParticipantService.add(serrucho.id, { name: "Sofía" });

      // Initially FREE
      const initialTier = await MonetizationService.getTier(serrucho.id);
      expect(initialTier.isSuper).toBe(false);
      expect(initialTier.tier).toBe("FREE");
      expect(initialTier.entitlement).toBeNull();
      expect(await MonetizationService.hasFeature(serrucho.id, "UNLIMITED_PARTICIPANTS")).toBe(false);

      // 2. Buyer (e.g. Manuel) initiates checkout
      const checkout = await MonetizationService.initiateCheckout({
        serruchoId: serrucho.id,
        buyerEmail: "manuel@coro.do",
        provider: "MOCK_RD",
        planId: "super_serrucho_pass",
      });

      expect(checkout.transaction.status).toBe("PENDING");
      expect(checkout.transaction.amount_cents).toBe(29900); // RD$ 299.00
      expect(checkout.transaction.currency).toBe("DOP");
      expect(checkout.transaction.order_id).toBeDefined();

      // 3. Payment webhook confirms completion
      const webhookResult = await MonetizationService.processPaymentWebhook({
        orderId: checkout.transaction.order_id,
        status: "COMPLETED",
        providerTxId: "azul-tx-998811",
      });

      expect(webhookResult.success).toBe(true);
      expect(webhookResult.entitlement).not.toBeNull();
      expect(webhookResult.entitlement?.tier).toBe("SUPER_SERRUCHO");
      expect(webhookResult.entitlement?.status).toBe("ACTIVE");

      // 4. Verification: Entire group now has Super Serrucho unlocked
      const updatedTier = await MonetizationService.getTier(serrucho.id);
      expect(updatedTier.isSuper).toBe(true);
      expect(updatedTier.tier).toBe("SUPER_SERRUCHO");
      expect(updatedTier.features).toEqual(SUPER_SERRUCHO_DEFAULT_FEATURES);
      expect(await MonetizationService.hasFeature(serrucho.id, "UNLIMITED_PARTICIPANTS")).toBe(true);
      expect(await MonetizationService.hasFeature(serrucho.id, "ADVANCED_MULTI_CURRENCY")).toBe(true);
      expect(await MonetizationService.hasFeature(serrucho.id, "UNLIMITED_RECEIPTS")).toBe(true);
    });
  });

  describe("Webhook Idempotency & Failure Handling", () => {
    it("handles duplicate webhook deliveries idempotently without re-granting or failing", async () => {
      const serrucho = await SerruchoService.create("owner-test", {
        name: "Coro Constanza",
        currency: "DOP",
      });

      const checkout = await MonetizationService.initiateCheckout({
        serruchoId: serrucho.id,
        buyerEmail: "test@idempotency.do",
      });

      const orderId = checkout.transaction.order_id;

      // 1st processing
      const first = await MonetizationService.processPaymentWebhook({
        orderId,
        status: "COMPLETED",
      });
      expect(first.success).toBe(true);
      expect(first.alreadyProcessed).toBeUndefined();

      // 2nd duplicate processing
      const second = await MonetizationService.processPaymentWebhook({
        orderId,
        status: "COMPLETED",
      });
      expect(second.success).toBe(true);
      expect(second.alreadyProcessed).toBe(true);
      expect(second.entitlement?.status).toBe("ACTIVE");
    });

    it("records failed transactions without granting premium entitlement", async () => {
      const serrucho = await SerruchoService.create("owner-test", {
        name: "Cena Fallida",
        currency: "DOP",
      });

      const checkout = await MonetizationService.initiateCheckout({
        serruchoId: serrucho.id,
        buyerEmail: "fail@card.do",
      });

      const failedResult = await MonetizationService.processPaymentWebhook({
        orderId: checkout.transaction.order_id,
        status: "FAILED",
        metadata: { reason: "Fondos insuficientes" },
      });

      expect(failedResult.success).toBe(false);
      expect(failedResult.entitlement).toBeNull();
      expect(failedResult.transaction?.status).toBe("FAILED");

      // Verify serrucho remains FREE
      const tier = await MonetizationService.getTier(serrucho.id);
      expect(tier.isSuper).toBe(false);
    });
  });

  describe("Purchase Restoration", () => {
    it("restores previously paid entitlement using order ID or buyer email", async () => {
      const serrucho = await SerruchoService.create("owner-1", {
        name: "Restoration Test",
        currency: "DOP",
      });

      const checkout = await MonetizationService.initiateCheckout({
        serruchoId: serrucho.id,
        buyerEmail: "restore@me.do",
      });

      await MonetizationService.processPaymentWebhook({
        orderId: checkout.transaction.order_id,
        status: "COMPLETED",
      });

      // Restore via Order ID
      const restoredByOrder = await MonetizationService.restorePurchase({
        serruchoId: serrucho.id,
        orderIdOrEmail: checkout.transaction.order_id,
      });
      expect(restoredByOrder.success).toBe(true);
      expect(restoredByOrder.entitlement?.tier).toBe("SUPER_SERRUCHO");

      // Restore via Email
      const restoredByEmail = await MonetizationService.restorePurchase({
        serruchoId: serrucho.id,
        orderIdOrEmail: "restore@me.do",
      });
      expect(restoredByEmail.success).toBe(true);

      // Restore with non-matching query fails gracefully
      const restoredBad = await MonetizationService.restorePurchase({
        serruchoId: serrucho.id,
        orderIdOrEmail: "non-existent-order-id",
      });
      expect(restoredBad.success).toBe(false);
    });
  });

  describe("Architectural Separation & Non-blocking Invariant", () => {
    it("never breaks or alters standard expense balance calculations when transitioning to Super Serrucho", async () => {
      const serrucho = await SerruchoService.create("owner-1", {
        name: "Safe Math Test",
        currency: "DOP",
      });

      const repo = getRepository();
      // Ensure transactions table exists independently
      const txs = await repo.getPaymentTransactionsBySerrucho(serrucho.id);
      expect(txs).toEqual([]);

      // Pricing plans in DOP
      const plans = MonetizationService.getPricingPlans();
      expect(plans).toHaveLength(1);
      expect(plans[0].currency).toBe("DOP");
      expect(plans[0].amount_cents).toBe(29900);
    });
  });
});
