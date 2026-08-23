import { NextRequest, NextResponse } from "next/server";
import { ActivityService } from "@/features/activity/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serruchoId } = await params;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);

    const activities = await ActivityService.listBySerrucho(serruchoId, limit);
    return NextResponse.json(activities);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al obtener historial de actividad" },
      { status: 500 }
    );
  }
}
