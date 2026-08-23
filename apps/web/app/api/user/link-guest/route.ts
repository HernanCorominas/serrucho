import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/features/auth/service";
import { handleApiError } from "@/lib/security/permissions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere ID de usuario para vincular" },
        { status: 400 }
      );
    }

    // Case 1: Single participant link
    if (body.participantId && body.serruchoId) {
      const linked = await AuthService.linkGuestParticipant(
        userId,
        body.serruchoId,
        body.participantId
      );
      return NextResponse.json({ success: true, participant: linked });
    }

    // Case 2: Batch linking of guest sessions
    if (Array.isArray(body.items)) {
      const result = await AuthService.linkLocalGuestSessions(userId, body.items);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { error: "Parámetros inválidos. Proporcione participantId o array de items" },
      { status: 400 }
    );
  } catch (err: any) {
    return handleApiError(err);
  }
}
