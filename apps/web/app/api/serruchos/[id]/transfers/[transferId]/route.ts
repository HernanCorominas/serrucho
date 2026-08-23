import { NextRequest, NextResponse } from "next/server";
import { TransferService } from "@/features/transfers/service";

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
