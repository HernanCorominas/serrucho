import { NextRequest, NextResponse } from "next/server";
import { MonetizationService } from "@/features/monetization/service";
import { handleApiError } from "@/lib/security/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (!body.orderIdOrEmail) {
      return NextResponse.json(
        { error: "Se requiere número de orden o email para restaurar" },
        { status: 400 }
      );
    }

    const result = await MonetizationService.restorePurchase({
      serruchoId: id,
      orderIdOrEmail: body.orderIdOrEmail,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return handleApiError(err);
  }
}
