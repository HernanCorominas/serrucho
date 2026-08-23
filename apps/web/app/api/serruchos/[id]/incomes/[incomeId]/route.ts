import { NextRequest, NextResponse } from "next/server";
import { IncomeService } from "@/features/incomes/service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; incomeId: string }> }
) {
  try {
    const { incomeId } = await params;
    const success = await IncomeService.delete(incomeId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
