export interface SettlementNotification {
  serruchoId: string;
  serruchoName: string;
  participantId: string;
  participantName: string;
  participantEmail: string | null;
  participantPhone: string | null;
  balanceCents: number; // positive = receives, negative = owes
  totalExpensesCents: number;
  owedCents: number;
  paidCents: number;
  paymentInstructions: string | null;
  paymentDeadline: string | null;
  publicUrl: string;
}

export interface NotificationResult {
  success: boolean;
  channel: "EMAIL" | "WHATSAPP";
  destinationMasked: string;
  providerMessageId?: string;
  error?: string;
}

export interface NotificationProvider {
  readonly channel: "EMAIL" | "WHATSAPP";
  isAvailable(): boolean;
  sendSettlement(notification: SettlementNotification): Promise<NotificationResult>;
}
