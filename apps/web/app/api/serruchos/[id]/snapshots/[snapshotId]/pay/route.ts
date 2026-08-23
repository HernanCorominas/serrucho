import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { togglePaymentSchema } from "@/lib/validations/schemas";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const { id, snapshotId } = await params;
    await assertWritePermission(id, req);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const validated = togglePaymentSchema.parse(body);
    const repo = getRepository();
    const updated = await repo.markSnapshotPaid(snapshotId, validated.is_paid, {
      payment_method: validated.payment_method,
      payment_notes: validated.payment_notes,
      paid_amount_cents: validated.paid_amount_cents,
      payment_status: validated.payment_status,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return handleApiError(err);
  }
}

