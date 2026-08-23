import { NextRequest, NextResponse } from "next/server";
import { MonetizationService } from "@/features/monetization/service";
import { handleApiError } from "@/lib/security/permissions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.orderId || !body.status) {
      return NextResponse.json(
        { error: "Se requieren orderId y status para procesar el webhook" },
        { status: 400 }
      );
    }

    const result = await MonetizationService.processPaymentWebhook({
      orderId: body.orderId,
      status: body.status,
      providerTxId: body.providerTxId,
      metadata: body.metadata,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return handleApiError(err);
  }
}
