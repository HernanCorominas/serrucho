import { NextRequest, NextResponse } from "next/server";
import { WhatsAppReminderService } from "@/features/notifications/whatsapp-reminder-service";
import { handleApiError } from "@/lib/security/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params;
    const body = await req.json().catch(() => ({}));

    if (!body.debtorName || body.amountCents === undefined) {
      return NextResponse.json(
        { error: "Se requieren debtorName y amountCents" },
        { status: 400 }
      );
    }

    const result = await WhatsAppReminderService.recordReminderIntent({
      serruchoId: id,
      debtorParticipantId: participantId,
      debtorName: body.debtorName,
      senderName: body.senderName,
      phone: body.phone,
      amountCents: body.amountCents,
      customMessage: body.customMessage,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return handleApiError(err);
  }
}
