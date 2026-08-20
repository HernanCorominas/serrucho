import { NextRequest, NextResponse } from "next/server";
import { SettlementService } from "@/features/settlements/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo de solicitud JSON no válido" }, { status: 400 });
    }
    const result = await SettlementService.closeSerrucho(id, body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
