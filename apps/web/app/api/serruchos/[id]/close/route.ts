import { NextRequest, NextResponse } from "next/server";
import { SettlementService } from "@/features/settlements/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await assertWritePermission(id, req);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo de solicitud JSON no válido" }, { status: 400 });
    }
    const result = await SettlementService.closeSerrucho(id, body);
    return NextResponse.json(result);
  } catch (err: any) {
    return handleApiError(err);
  }
}

