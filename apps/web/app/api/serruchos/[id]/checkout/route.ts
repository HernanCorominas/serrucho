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

    const result = await MonetizationService.initiateCheckout({
      serruchoId: id,
      buyerUserId: body.buyerUserId || req.headers.get("x-user-id"),
      buyerEmail: body.buyerEmail,
      provider: body.provider || "MOCK_RD",
      planId: body.planId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return handleApiError(err);
  }
}
