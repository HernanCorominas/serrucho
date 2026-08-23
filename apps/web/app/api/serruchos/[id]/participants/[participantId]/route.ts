import { NextRequest, NextResponse } from "next/server";
import { ParticipantService } from "@/features/participants/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params;
    await assertWritePermission(id, req);
    const body = await req.json();
    const updated = await ParticipantService.update(participantId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params;
    await assertWritePermission(id, req);
    const success = await ParticipantService.delete(participantId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return handleApiError(err);
  }
}
