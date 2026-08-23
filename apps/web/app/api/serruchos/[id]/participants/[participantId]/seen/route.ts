import { NextRequest, NextResponse } from "next/server";
import { ParticipantService } from "@/features/participants/service";
import { ParticipantAccessStatus } from "@/lib/types/domain";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id: serruchoId, participantId } = await params;
    const body = await req.json().catch(() => ({}));
    const targetStatus = (body.status as ParticipantAccessStatus) || "ACCESSED";

    const participant = await ParticipantService.getById(participantId);
    if (!participant || participant.serrucho_id !== serruchoId) {
      return NextResponse.json(
        { error: "Participante no encontrado en este serrucho" },
        { status: 404 }
      );
    }

    const updated = await ParticipantService.markSeen(participantId, targetStatus);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al actualizar estado de presencia" },
      { status: 400 }
    );
  }
}
