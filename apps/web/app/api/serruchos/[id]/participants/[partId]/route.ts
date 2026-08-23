import { NextRequest, NextResponse } from "next/server";
import { ParticipantService } from "@/features/participants/service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const { partId } = await params;
    const body = await req.json();
    const updated = await ParticipantService.update(partId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const { partId } = await params;
    const success = await ParticipantService.delete(partId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
