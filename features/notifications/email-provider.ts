import { Resend } from "resend";
import { formatDOP } from "@/lib/finance/math";
import { maskDestination } from "@/lib/security/tokens";
import { NotificationProvider, NotificationResult, SettlementNotification } from "./types";

export function generateSettlementEmailHtml(notification: SettlementNotification): string {
  const {
    serruchoName,
    participantName,
    balanceCents,
    totalExpensesCents,
    owedCents,
    paidCents,
    paymentInstructions,
    paymentDeadline,
    publicUrl,
  } = notification;

  const isDebtor = balanceCents < 0;
  const isCreditor = balanceCents > 0;
  const isSettled = balanceCents === 0;

  const statusBg = isDebtor ? "#fef2f2" : isCreditor ? "#ecfdf5" : "#f3f4f6";
  const statusColor = isDebtor ? "#dc2626" : isCreditor ? "#059669" : "#4b5563";
  const statusTitle = isDebtor
    ? "Tienes un saldo pendiente por pagar"
    : isCreditor
    ? "Tienes un saldo a tu favor (debes recibir)"
    : "¡Estás al día! No tienes saldo pendiente";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Estado de Cuenta - ${serruchoName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 16px; margin-bottom: 20px; color: #334155; }
    .card { background: ${statusBg}; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .card-title { font-size: 13px; text-transform: uppercase; font-weight: 700; color: ${statusColor}; letter-spacing: 0.5px; margin-bottom: 6px; }
    .card-amount { font-size: 32px; font-weight: 900; color: ${statusColor}; margin: 4px 0; }
    .breakdown { background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 14px; }
    .breakdown-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
    .breakdown-row:last-child { border-bottom: none; font-weight: 700; }
    .instructions { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .instructions h4 { margin: 0 0 8px 0; color: #92400e; font-size: 14px; }
    .instructions p { margin: 0; color: #78350f; font-size: 13px; white-space: pre-wrap; }
    .btn-container { text-align: center; margin: 32px 0 16px 0; }
    .btn { display: inline-block; background-color: #0d9488; color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 10px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px 24px; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🪚 Serrucho</h1>
      <p>Cierre de gastos: <strong>${serruchoName}</strong></p>
    </div>
    <div class="content">
      <div class="greeting">
        Hola <strong>${participantName}</strong>,<br>
        El serrucho para <strong>${serruchoName}</strong> ha sido cerrado y este es tu balance final:
      </div>

      <div class="card">
        <div class="card-title">${statusTitle}</div>
        <div class="card-amount">${formatDOP(Math.abs(balanceCents))}</div>
      </div>

      <div class="breakdown">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Total de gastos del grupo:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatDOP(totalExpensesCents)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Tu parte correspondiente:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatDOP(owedCents)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Monto que pagaste:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatDOP(paidCents)}</td>
          </tr>
          <tr style="border-top: 1px solid #cbd5e1; font-weight: 700;">
            <td style="padding: 8px 0; color: #1e293b;">Balance final:</td>
            <td style="padding: 8px 0; text-align: right; color: ${statusColor};">${formatDOP(balanceCents, true)}</td>
          </tr>
        </table>
      </div>

      ${
        paymentInstructions && isDebtor
          ? `
      <div class="instructions">
        <h4>🏦 Instrucciones de pago del organizador:</h4>
        <p>${paymentInstructions}</p>
        ${
          paymentDeadline
            ? `<div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: #b45309;">📅 Fecha límite: ${paymentDeadline}</div>`
            : ""
        }
      </div>`
          : ""
      }

      <div class="btn-container">
        <a href="${publicUrl}" class="btn" target="_blank">Ver mi estado de cuenta detallado ➔</a>
      </div>
    </div>
    <div class="footer">
      Serrucho · Hecho para dividir gastos sin enredos 🇩🇴<br>
      Este enlace es personal y seguro para consultar tu estado sin registro.
    </div>
  </div>
</body>
</html>
  `;
}

export class ResendEmailProvider implements NotificationProvider {
  readonly channel = "EMAIL" as const;
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || "Serrucho <notificaciones@serrucho.do>";
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  isAvailable(): boolean {
    return !!process.env.RESEND_API_KEY;
  }

  async sendSettlement(notification: SettlementNotification): Promise<NotificationResult> {
    const email = notification.participantEmail;
    const masked = email ? maskDestination(email) : "***";

    if (!email) {
      return {
        success: false,
        channel: "EMAIL",
        destinationMasked: masked,
        error: "El participante no tiene correo electrónico configurado",
      };
    }

    if (!this.resend) {
      // Local / Dev simulated email when API key not set
      console.log(`[Resend Simulated Email to ${masked}] Subject: Estado de cuenta - ${notification.serruchoName}`);
      return {
        success: true,
        channel: "EMAIL",
        destinationMasked: masked,
        providerMessageId: `simulated-email-${Date.now()}`,
      };
    }

    try {
      const html = generateSettlementEmailHtml(notification);
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `🪚 Estado de Cuenta: ${notification.serruchoName}`,
        html,
      });

      if (error) {
        return {
          success: false,
          channel: "EMAIL",
          destinationMasked: masked,
          error: error.message,
        };
      }

      return {
        success: true,
        channel: "EMAIL",
        destinationMasked: masked,
        providerMessageId: data?.id,
      };
    } catch (err: any) {
      return {
        success: false,
        channel: "EMAIL",
        destinationMasked: masked,
        error: err.message || "Error al enviar correo por Resend",
      };
    }
  }
}
