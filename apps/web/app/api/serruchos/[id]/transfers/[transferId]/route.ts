import { NextRequest, NextResponse } from "next/server";
import { TransferService } from "@/features/transfers/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; transferId: string }> }
) {
  try {
    const { id, transferId } = await params;
    await assertWritePermission(id, req);
    const body = await req.json();
    const updated = await TransferService.update(transferId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  params: { params: Promise<{ id: string; transferId: string }> }
) {
  return PATCH(req, params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; transferId: string }> }
) {
  try {
    const { id, transferId } = await params;
    await assertWritePermission(id, req);
    const success = await TransferService.delete(transferId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return handleApiError(err);
  }
}

