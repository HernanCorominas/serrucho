import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/store";
import { togglePaymentSchema } from "@/lib/validations/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  try {
    const { snapshotId } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { is_paid } = togglePaymentSchema.parse(body);
    const repo = getRepository();
    const updated = await repo.markSnapshotPaid(snapshotId, is_paid);

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar estado de pago" }, { status: 400 });
  }
}
