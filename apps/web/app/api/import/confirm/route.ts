import { NextRequest, NextResponse } from "next/server";
import { ImportService } from "@/features/import/service";
import { handleApiError } from "@/lib/security/permissions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || req.headers.get("x-user-id") || "guest-anonymous";

    if (!body.serrucho_name || !body.participant_names || body.participant_names.length === 0) {
      return NextResponse.json(
        { error: "Se requieren nombre del Serrucho y lista de participantes" },
        { status: 400 }
      );
    }

    const result = await ImportService.confirmAndPersist(userId, {
      serrucho_name: body.serrucho_name,
      currency: body.currency || "DOP",
      description: body.description,
      participant_names: body.participant_names,
      movements: body.movements || [],
    });

    return NextResponse.json({
      success: true,
      serruchoId: result.serrucho.id,
      participantsCount: result.participantsCount,
      movementsCount: result.movementsCount,
      redirectUrl: `/dashboard/${result.serrucho.id}`,
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
