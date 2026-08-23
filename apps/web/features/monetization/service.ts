import { getRepository } from "@/lib/store";
import {
  SerruchoTier,
  SuperSerruchoFeature,
  SerruchoEntitlement,
  PaymentTransaction,
  PaymentProvider,
  PaymentStatus,
  SuperSerruchoPlan,
} from "@/lib/types/domain";
import { ActivityService } from "@/features/activity/service";

export const SUPER_SERRUCHO_DEFAULT_FEATURES: SuperSerruchoFeature[] = [
  "UNLIMITED_PARTICIPANTS",
  "ADVANCED_MULTI_CURRENCY",
  "UNLIMITED_RECEIPTS",
  "CUSTOM_EXCEL_TEMPLATES",
  "EXPANDED_AUDIT_HISTORY",
  "EXPANDED_AI_RECEIPTS",
];

export const SUPER_SERRUCHO_PLANS: SuperSerruchoPlan[] = [
  {
    id: "super_serrucho_pass",
    name: "Super Serrucho (Desbloqueo Grupal)",
    description: "1 solo pago para desbloquear el serrucho completo para TODOS los participantes.",
    amount_cents: 29900, // RD$ 299.00
    currency: "DOP",
    features: SUPER_SERRUCHO_DEFAULT_FEATURES,
  },
];

export class MonetizationService {
  /**
   * Returns all publicly available monetization plans.
   */
  static getPricingPlans(): SuperSerruchoPlan[] {
    return SUPER_SERRUCHO_PLANS;
  }

  /**
   * Gets current tier, entitlement status, and active features for a given Serrucho.
   */
  static async getTier(serruchoId: string): Promise<{
    isSuper: boolean;
    tier: SerruchoTier;
    entitlement: SerruchoEntitlement | null;
    features: SuperSerruchoFeature[];
  }> {
    const repo = getRepository();
    const entitlement = await repo.getEntitlementBySerrucho(serruchoId);

    if (entitlement && entitlement.status === "ACTIVE") {
      // Check expiration if applicable
      if (entitlement.expires_at && new Date(entitlement.expires_at).getTime() < Date.now()) {
        return {
          isSuper: false,
          tier: "FREE",
          entitlement: { ...entitlement, status: "EXPIRED" },
          features: [],
        };
      }

      return {
        isSuper: true,
        tier: "SUPER_SERRUCHO",
        entitlement,
        features: entitlement.features,
      };
    }

    return {
      isSuper: false,
      tier: "FREE",
      entitlement: null,
      features: [],
    };
  }

  /**
   * Checks if a Serrucho has entitlement for a specific premium feature.
   */
  static async hasFeature(
    serruchoId: string,
    feature: SuperSerruchoFeature
  ): Promise<boolean> {
    const { isSuper, features } = await this.getTier(serruchoId);
    if (!isSuper) return false;
    return features.includes(feature);
  }

  /**
   * Initiates a checkout transaction for unlocking Super Serrucho.
   * Completely decoupled from expense calculations.
   */
  static async initiateCheckout(params: {
    serruchoId: string;
    buyerUserId?: string | null;
    buyerEmail?: string | null;
    provider?: PaymentProvider;
    planId?: string;
  }): Promise<{
    transaction: PaymentTransaction;
    plan: SuperSerruchoPlan;
    checkoutUrl?: string;
  }> {
    const repo = getRepository();
    const serrucho = await repo.getSerruchoById(params.serruchoId);
    if (!serrucho) throw new Error("Serrucho no encontrado");

    const plan =
      SUPER_SERRUCHO_PLANS.find((p) => p.id === params.planId) || SUPER_SERRUCHO_PLANS[0];

    const orderId = `ord-${serrucho.id.substring(0, 8)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const tx: PaymentTransaction = {
      id: txId,
      serrucho_id: serrucho.id,
      order_id: orderId,
      buyer_user_id: params.buyerUserId || null,
      buyer_email: params.buyerEmail || null,
      amount_cents: plan.amount_cents,
      currency: plan.currency,
      provider: params.provider || "MOCK_RD",
      status: "PENDING",
      provider_tx_id: null,
      metadata: {
        plan_id: plan.id,
        serrucho_name: serrucho.name,
      },
      created_at: now,
      updated_at: now,
    };

    const savedTx = await repo.createPaymentTransaction(tx);

    return {
      transaction: savedTx,
      plan,
      checkoutUrl: `/api/payments/checkout-session?orderId=${orderId}`,
    };
  }

  /**
   * Processes a payment webhook or confirmation idempotently.
   * Unlocks Super Serrucho for the entire group on success.
   */
  static async processPaymentWebhook(params: {
    orderId: string;
    status: PaymentStatus;
    providerTxId?: string | null;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    alreadyProcessed?: boolean;
    transaction: PaymentTransaction | null;
    entitlement: SerruchoEntitlement | null;
  }> {
    const repo = getRepository();
    const tx = await repo.getPaymentTransactionByOrderId(params.orderId);
    if (!tx) {
      throw new Error(`Transacción con order_id "${params.orderId}" no encontrada`);
    }

    // Idempotency: if already completed, return without re-granting
    if (tx.status === "COMPLETED" && params.status === "COMPLETED") {
      const existingEntitlement = await repo.getEntitlementBySerrucho(tx.serrucho_id);
      return {
        success: true,
        alreadyProcessed: true,
        transaction: tx,
        entitlement: existingEntitlement,
      };
    }

    const updatedTx = await repo.updatePaymentTransaction(tx.id, {
      status: params.status,
      provider_tx_id: params.providerTxId || tx.provider_tx_id,
      metadata: {
        ...tx.metadata,
        ...params.metadata,
      },
    });

    if (params.status === "COMPLETED") {
      const now = new Date().toISOString();
      const entitlementId = `ent-${tx.serrucho_id}`;

      const entitlement: SerruchoEntitlement = {
        id: entitlementId,
        serrucho_id: tx.serrucho_id,
        tier: "SUPER_SERRUCHO",
        status: "ACTIVE",
        features: SUPER_SERRUCHO_DEFAULT_FEATURES,
        buyer_user_id: tx.buyer_user_id,
        buyer_email: tx.buyer_email,
        order_id: tx.order_id,
        amount_cents: tx.amount_cents,
        currency: tx.currency,
        granted_at: now,
        expires_at: null, // Lifetime per-serrucho pass
        created_at: now,
        updated_at: now,
      };

      const savedEntitlement = await repo.saveEntitlement(entitlement);

      // Audit trail
      await ActivityService.record({
        serrucho_id: tx.serrucho_id,
        actor_name: tx.buyer_email || "Comprador",
        action_type: "SERRUCHO_UPDATED",
        entity_type: "SERRUCHO",
        entity_id: tx.serrucho_id,
        summary: "¡Este Serrucho ha sido mejorado a Super Serrucho ⚡ para todo el grupo!",
      });

      return {
        success: true,
        transaction: updatedTx,
        entitlement: savedEntitlement,
      };
    }

    return {
      success: false,
      transaction: updatedTx,
      entitlement: null,
    };
  }

  /**
   * Restores a previously paid purchase using Order ID or Buyer Email.
   */
  static async restorePurchase(params: {
    serruchoId: string;
    orderIdOrEmail: string;
  }): Promise<{
    success: boolean;
    entitlement: SerruchoEntitlement | null;
    message: string;
  }> {
    const repo = getRepository();
    const query = params.orderIdOrEmail.trim();
    if (!query) {
      return { success: false, entitlement: null, message: "Ingresa un número de orden o email válido" };
    }

    // 1. Try order ID lookup
    const txByOrder = await repo.getPaymentTransactionByOrderId(query);
    if (txByOrder && txByOrder.serrucho_id === params.serruchoId && txByOrder.status === "COMPLETED") {
      const res = await this.processPaymentWebhook({
        orderId: txByOrder.order_id,
        status: "COMPLETED",
        providerTxId: txByOrder.provider_tx_id,
      });
      return {
        success: true,
        entitlement: res.entitlement,
        message: "¡Super Serrucho restaurado con éxito!",
      };
    }

    // 2. Try serrucho transactions list
    const transactions = await repo.getPaymentTransactionsBySerrucho(params.serruchoId);
    const matched = transactions.find(
      (t) =>
        t.status === "COMPLETED" &&
        (t.order_id === query || (t.buyer_email && t.buyer_email.toLowerCase() === query.toLowerCase()))
    );

    if (matched) {
      const res = await this.processPaymentWebhook({
        orderId: matched.order_id,
        status: "COMPLETED",
        providerTxId: matched.provider_tx_id,
      });
      return {
        success: true,
        entitlement: res.entitlement,
        message: "¡Super Serrucho restaurado con éxito!",
      };
    }

    return {
      success: false,
      entitlement: null,
      message: "No se encontró ningún pago completado asociado a estos datos para este Serrucho.",
    };
  }
}
