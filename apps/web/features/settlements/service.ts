import { getRepository } from "@/lib/store";
import {
  ParticipantFinancials,
  PublicSettlementReceipt,
  SettlementSnapshot,
} from "@/lib/types/domain";
import { closeSerruchoSchema, CloseSerruchoInput } from "@/lib/validations/schemas";
import { calculateNetBalances } from "@/lib/finance/math";
import { generateSettlementToken, hashSettlementToken } from "@/lib/security/tokens";
import { NotificationRouter } from "@/features/notifications/router";
import { SettlementNotification } from "@/features/notifications/types";

export interface LiveSettlementData {
  serruchoId: string;
  totalExpensesCents: number;
  participants: ParticipantFinancials[];
  creditors: ParticipantFinancials[];
  debtors: ParticipantFinancials[];
  settled: ParticipantFinancials[];
}

export interface CloseResult {
  serruchoId: string;
  closedAt: string;
  snapshots: (SettlementSnapshot & {
    participant_name: string;
    raw_token: string;
    public_url: string;
    notification_status?: string;
  })[];
}

export class SettlementService {
  /**
   * Calculates live, real-time balances for all participants without closing the serrucho.
   */
  static async calculateLiveSettlement(serruchoId: string): Promise<LiveSettlementData> {
    const repo = getRepository();
    const [participants, expenses, transfers] = await Promise.all([
      repo.getParticipants(serruchoId),
      repo.getExpenses(serruchoId),
      repo.getTransfers(serruchoId),
    ]);

    const participantIds = participants.map((p) => p.id);

    const expenseDetails = await Promise.all(
      expenses.map(async (exp) => {
        const splits = await repo.getExpenseSplits(exp.id);
        return {
          paidByParticipantId: exp.paid_by_participant_id,
          amountCents: exp.amount_cents,
          splits: splits.map((s) => ({
            participantId: s.participant_id,
            owedCents: s.owed_cents,
          })),
        };
      })
    );

    const transferDetails = transfers.map((t) => ({
      senderParticipantId: t.sender_participant_id,
      receiverParticipantId: t.receiver_participant_id,
      amountCents: t.amount_cents,
    }));

    const netMap = calculateNetBalances(participantIds, expenseDetails, transferDetails);
    const totalExpensesCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);

    const enrichedParticipants: ParticipantFinancials[] = participants.map((p) => {
      const fin = netMap.get(p.id) || {
        totalPaidCents: 0,
        totalOwedCents: 0,
        netBalanceCents: 0,
      };
      return {
        ...p,
        total_paid_cents: fin.totalPaidCents,
        total_owed_cents: fin.totalOwedCents,
        net_balance_cents: fin.netBalanceCents,
      };
    });

    return {
      serruchoId,
      totalExpensesCents,
      participants: enrichedParticipants,
      creditors: enrichedParticipants.filter((p) => p.net_balance_cents > 0),
      debtors: enrichedParticipants.filter((p) => p.net_balance_cents < 0),
      settled: enrichedParticipants.filter((p) => p.net_balance_cents === 0),
    };
  }

  /**
   * Closes a serrucho permanently:
   * 1. Creates immutable snapshots and line items.
   * 2. Sets status to CLOSED.
   * 3. Dispatches notifications.
   */
  static async closeSerrucho(
    serruchoId: string,
    input: CloseSerruchoInput,
    baseUrl: string = "http://localhost:3000",
    notificationRouter?: NotificationRouter
  ): Promise<CloseResult> {
    const validated = closeSerruchoSchema.parse(input);
    const repo = getRepository();

    const serrucho = await repo.getSerruchoById(serruchoId);
    if (!serrucho) throw new Error("Serrucho no encontrado");
    if (serrucho.status === "CLOSED") {
      throw new Error("Este serrucho ya ha sido cerrado");
    }

    const [participants, expenses] = await Promise.all([
      repo.getParticipants(serruchoId),
      repo.getExpenses(serruchoId),
    ]);

    if (participants.length === 0) {
      throw new Error("No puedes cerrar un serrucho sin participantes");
    }

    const liveData = await this.calculateLiveSettlement(serruchoId);
    const participantMap = new Map(participants.map((p) => [p.id, p]));

    // Fetch all splits and build line item records per participant
    const expenseLineItems = await Promise.all(
      expenses.map(async (exp) => {
        const splits = await repo.getExpenseSplits(exp.id);
        const payer = participantMap.get(exp.paid_by_participant_id);
        return {
          expenseId: exp.id,
          description: exp.description,
          paidByName: payer?.name || "Desconocido",
          amountCents: exp.amount_cents,
          splits,
        };
      })
    );

    const snapshotEntries: {
      snapshot: Omit<SettlementSnapshot, "id" | "created_at">;
      items: {
        expense_id: string | null;
        description: string;
        paid_by_name: string;
        amount_cents: number;
        participant_owed_cents: number;
      }[];
      rawToken: string;
      participantName: string;
      participantEmail: string | null;
      participantPhone: string | null;
      preferredChannel: "EMAIL" | "WHATSAPP";
    }[] = [];

    for (const p of liveData.participants) {
      const rawToken = generateSettlementToken();
      const tokenHash = hashSettlementToken(rawToken);

      // Collect line items where this participant had a split
      const items = expenseLineItems
        .filter((exp) => exp.splits.some((s) => s.participant_id === p.id))
        .map((exp) => {
          const split = exp.splits.find((s) => s.participant_id === p.id)!;
          return {
            expense_id: exp.expenseId,
            description: exp.description,
            paid_by_name: exp.paidByName,
            amount_cents: exp.amountCents,
            participant_owed_cents: split.owed_cents,
          };
        });

      snapshotEntries.push({
        snapshot: {
          serrucho_id: serruchoId,
          participant_id: p.id,
          total_expenses_cents: liveData.totalExpensesCents,
          owed_cents: p.total_owed_cents,
          paid_cents: p.total_paid_cents,
          balance_cents: p.net_balance_cents,
          payment_instructions: validated.payment_instructions,
          payment_deadline: validated.payment_deadline,
          public_token_hash: tokenHash,
          is_paid: false,
          paid_at: null,
        },
        items,
        rawToken,
        participantName: p.name,
        participantEmail: p.email,
        participantPhone: p.phone,
        preferredChannel: p.preferred_channel,
      });
    }

    // Persist snapshots
    const createdSnapshots = await repo.createSettlementSnapshots(
      snapshotEntries.map((e) => ({
        snapshot: e.snapshot,
        items: e.items,
        rawToken: e.rawToken,
      } as any))
    );

    // Update Serrucho to CLOSED
    const closedAt = new Date().toISOString();
    await repo.updateSerrucho(serruchoId, {
      status: "CLOSED",
      closed_at: closedAt,
      payment_instructions: validated.payment_instructions,
      payment_deadline: validated.payment_deadline,
    });

    // Dispatch Notifications asynchronously (resilient)
    const router = notificationRouter || new NotificationRouter();
    const routerBatchItems: {
      notification: SettlementNotification;
      preferredChannel: "EMAIL" | "WHATSAPP";
    }[] = [];

    const snapshotResults: (SettlementSnapshot & {
      participant_name: string;
      raw_token: string;
      public_url: string;
      notification_status?: string;
    })[] = [];

    for (let i = 0; i < snapshotEntries.length; i++) {
      const entry = snapshotEntries[i];
      const snapshot = createdSnapshots[i];
      const publicUrl = `${baseUrl.replace(/\/$/, "")}/s/${entry.rawToken}`;

      const notification: SettlementNotification = {
        serruchoId,
        serruchoName: serrucho.name,
        participantId: entry.snapshot.participant_id,
        participantName: entry.participantName,
        participantEmail: entry.participantEmail,
        participantPhone: entry.participantPhone,
        balanceCents: entry.snapshot.balance_cents,
        totalExpensesCents: entry.snapshot.total_expenses_cents,
        owedCents: entry.snapshot.owed_cents,
        paidCents: entry.snapshot.paid_cents,
        paymentInstructions: entry.snapshot.payment_instructions,
        paymentDeadline: entry.snapshot.payment_deadline,
        publicUrl,
      };

      routerBatchItems.push({
        notification,
        preferredChannel: entry.preferredChannel,
      });

      snapshotResults.push({
        ...snapshot,
        participant_name: entry.participantName,
        raw_token: entry.rawToken,
        public_url: publicUrl,
      });
    }

    // Execute notification dispatch and log
    const notifResults = await router.routeBatch(routerBatchItems);
    for (let i = 0; i < notifResults.length; i++) {
      const res = notifResults[i];
      const snap = snapshotResults[i];
      snap.notification_status = res.success ? "SENT" : "FAILED";

      await repo.createNotificationLog({
        serrucho_id: serruchoId,
        participant_id: snap.participant_id,
        snapshot_id: snap.id,
        channel: res.channel,
        destination_masked: res.destinationMasked,
        status: res.success ? "SENT" : "FAILED",
        provider_message_id: res.providerMessageId || null,
        error_message: res.error || null,
        sent_at: res.success ? new Date().toISOString() : null,
      });
    }

    return {
      serruchoId,
      closedAt,
      snapshots: snapshotResults,
    };
  }

  /**
   * Retrieves an immutable settlement snapshot using the raw public token.
   */
  static async getPublicSettlement(token: string): Promise<PublicSettlementReceipt | null> {
    if (!token || token.trim().length === 0) return null;

    const tokenHash = hashSettlementToken(token);
    const repo = getRepository();
    const result = await repo.getSnapshotByTokenHash(tokenHash);
    if (!result) return null;

    return {
      snapshot: result.snapshot,
      participant: result.participant,
      serrucho: {
        name: result.serrucho.name,
        description: result.serrucho.description,
        event_date: result.serrucho.event_date,
        currency: result.serrucho.currency,
        closed_at: result.serrucho.closed_at,
      },
      items: result.items,
    };
  }
}
