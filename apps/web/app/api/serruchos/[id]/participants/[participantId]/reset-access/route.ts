import { NextRequest, NextResponse } from "next/server";
import { ParticipantService } from "@/features/participants/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params;
    await assertWritePermission(id, req);

    // Reset access status to INVITED and clear user_id (Decisión #3)
    const updated = await ParticipantService.update(participantId, {
      access_status: "INVITED",
      user_id: null,
      last_seen_at: null,
    });

    return NextResponse.json({
      success: true,
      participant: updated,
      message: "Acceso reiniciado. El participante puede volver a seleccionarse.",
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
