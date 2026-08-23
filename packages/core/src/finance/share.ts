/**
 * Serrucho Social & WhatsApp Sharing Engine
 * Generates clean, friendly, Dominican-adapted share messages and deep links.
 */

export interface InviteMessageParams {
  serruchoName: string;
  joinUrl: string;
  organizerName?: string;
}

export interface CollectionMessageParams {
  serruchoName: string;
  debtorName: string;
  amountFormatted: string;
  paymentInstructions?: string | null;
  receiptUrl?: string;
}

export interface SettlementSummaryParams {
  serruchoName: string;
  totalFormatted: string;
  settlementUrl: string;
}

/**
 * Generates an invitation message to join an active Serrucho.
 */
export function generateSerruchoInviteMessage(params: InviteMessageParams): string {
  const { serruchoName, joinUrl, organizerName } = params;
  const organizerHeader = organizerName ? ` por ${organizerName}` : "";

  return (
    `🌴 *¡Únete al Serrucho "${serruchoName}"${organizerHeader}!* 🪚\n\n` +
    `Entra aquí para ver los gastos del coro, agregar lo que pagaste y revisar las cuentas:\n` +
    `👉 ${joinUrl}\n\n` +
    `_Calculado fácil con Serrucho 🇩🇴_`
  );
}

/**
 * Generates a polite, 1-click collection (cobro) message via WhatsApp.
 */
export function generateSerruchoCollectionMessage(params: CollectionMessageParams): string {
  const { serruchoName, debtorName, amountFormatted, paymentInstructions, receiptUrl } = params;

  let msg = `Hola ${debtorName}! 👋 🪚 En el serrucho *"${serruchoName}"* te toca saldar *${amountFormatted}*.\n`;

  if (paymentInstructions && paymentInstructions.trim()) {
    msg += `\n💳 *Instrucciones de pago:*\n${paymentInstructions.trim()}\n`;
  }

  if (receiptUrl) {
    msg += `\n🧾 *Ver tu estado de cuenta detallado:*\n👉 ${receiptUrl}\n`;
  }

  msg += `\n¡Gracias! 🇩🇴`;
  return msg;
}

/**
 * Generates a final summary message when a Serrucho is closed.
 */
export function generateSerruchoSettlementSummaryMessage(params: SettlementSummaryParams): string {
  const { serruchoName, totalFormatted, settlementUrl } = params;

  return (
    `🔒 *¡Cuentas Cerradas — "${serruchoName}"!* 🪚\n\n` +
    `El serrucho total fue de *${totalFormatted}* y las deudas han sido calculadas con el mínimo de transferencias.\n\n` +
    `📊 Revisa la liquidación final y los comprobantes aquí:\n` +
    `👉 ${settlementUrl}\n\n` +
    `_Hecho con Serrucho 🇩🇴_`
  );
}

/**
 * Formats a phone number for WhatsApp URL (DOM standard +1 809/829/849 or international).
 */
export function formatPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9]/g, "");

  // Dominican 10-digit format (809xxxxxxx, 829xxxxxxx, 849xxxxxxx) -> prepend 1
  if (clean.length === 10 && (clean.startsWith("809") || clean.startsWith("829") || clean.startsWith("849"))) {
    clean = `1${clean}`;
  }

  return clean;
}

/**
 * Builds a direct WhatsApp Web / Native URL with prefilled encoded message.
 */
export function buildWhatsAppShareUrl(message: string, phone?: string | null): string {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message);

  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
