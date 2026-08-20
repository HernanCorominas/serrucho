import { NextRequest, NextResponse } from "next/server";
import { SettlementService } from "@/features/settlements/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settlement = await SettlementService.calculateLiveSettlement(id);
    return NextResponse.json(settlement);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
