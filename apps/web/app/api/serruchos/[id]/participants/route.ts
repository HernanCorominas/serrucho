import { NextRequest, NextResponse } from "next/server";
import { ParticipantService } from "@/features/participants/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const participants = await ParticipantService.listBySerrucho(id);
    return NextResponse.json(participants);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await assertWritePermission(id, req);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo de solicitud JSON no válido" }, { status: 400 });
    }
    const created = await ParticipantService.add(id, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

