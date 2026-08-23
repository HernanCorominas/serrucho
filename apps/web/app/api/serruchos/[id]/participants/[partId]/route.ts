import { NextRequest, NextResponse } from "next/server";
import { ParticipantService } from "@/features/participants/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const { id, partId } = await params;
    await assertWritePermission(id, req);
    const body = await req.json();
    const updated = await ParticipantService.update(partId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const { id, partId } = await params;
    await assertWritePermission(id, req);
    const success = await ParticipantService.delete(partId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return handleApiError(err);
  }
}

