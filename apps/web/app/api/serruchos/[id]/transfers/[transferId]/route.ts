import { NextRequest, NextResponse } from "next/server";
import { TransferService } from "@/features/transfers/service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; transferId: string }> }
) {
  try {
    const { transferId } = await params;
    const body = await req.json();
    const updated = await TransferService.update(transferId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar transferencia" }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  params: { params: Promise<{ id: string; transferId: string }> }
) {
  return PATCH(req, params);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; transferId: string }> }
) {
  try {
    const { transferId } = await params;
    const success = await TransferService.delete(transferId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
