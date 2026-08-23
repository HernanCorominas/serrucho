import { NextRequest, NextResponse } from "next/server";
import { MonetizationService } from "@/features/monetization/service";
import { handleApiError } from "@/lib/security/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tierData = await MonetizationService.getTier(id);
    const plans = MonetizationService.getPricingPlans();

    return NextResponse.json({
      ...tierData,
      plans,
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
