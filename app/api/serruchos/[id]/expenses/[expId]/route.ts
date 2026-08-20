import { NextRequest, NextResponse } from "next/server";
import { ExpenseService } from "@/features/expenses/service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expId: string }> }
) {
  try {
    const { expId } = await params;
    const success = await ExpenseService.delete(expId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
