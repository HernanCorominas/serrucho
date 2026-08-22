import { NextRequest, NextResponse } from "next/server";
import { SettlementService } from "@/features/settlements/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const receipt = await SettlementService.getPublicSettlement(token);
    if (!receipt) {
      return NextResponse.json(
        { error: "Estado de cuenta no encontrado o enlace inválido" },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
