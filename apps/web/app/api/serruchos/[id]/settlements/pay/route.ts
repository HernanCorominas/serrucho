import { NextRequest, NextResponse } from "next/server";
import { TransferService } from "@/features/transfers/service";
import { markSettledSchema } from "@/lib/validations/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serruchoId } = await params;
    const body = await req.json();
    const validated = markSettledSchema.parse(body);

    const notePrefix =
      validated.status === "PARTIAL"
        ? "[Pago Parcial] "
        : validated.status === "DISPUTED"
        ? "[En Revisión] "
        : "[Deuda Saldada] ";

    const combinedNotes = validated.notes
      ? `${notePrefix}${validated.notes}`
      : `${notePrefix}Pago registrado desde liquidación`;

    const transfer = await TransferService.add(serruchoId, {
      sender_participant_id: validated.from_participant_id,
      receiver_participant_id: validated.to_participant_id,
      amount: validated.amount,
      transfer_date: validated.payment_date,
      payment_method: validated.payment_method,
      notes: combinedNotes,
      receipt_url: validated.receipt_url || null,
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al registrar pago de liquidación" },
      { status: 400 }
    );
  }
}
