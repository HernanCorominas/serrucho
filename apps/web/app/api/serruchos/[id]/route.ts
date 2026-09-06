import { NextRequest, NextResponse } from "next/server";
import { SerruchoService } from "@/features/serruchos/service";
import { getRepository } from "@/lib/store";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serrucho = await SerruchoService.getById(id);
    if (!serrucho) {
      return NextResponse.json({ error: "Serrucho no encontrado" }, { status: 404 });
    }

    // Ensure read_only_token exists
    if (!serrucho.read_only_token) {
      serrucho.read_only_token = await SerruchoService.getReadOnlyToken(id);
    }

    const repo = getRepository();
    const [participants, expenses, snapshots, logs] = await Promise.all([
      repo.getParticipants(id),
      repo.getExpenses(id),
      repo.getSnapshotsBySerrucho(id),
      repo.getNotificationLogs(id),
    ]);

    const participantMap = new Map(participants.map((p) => [p.id, p]));

    const enrichedSnapshots = snapshots.map((s) => {
      const rawToken = (s as any).raw_token;
      return {
        ...s,
        raw_token: rawToken,
        public_url: rawToken ? `/s/${rawToken}` : (s as any).public_url || "",
        participant: participantMap.get(s.participant_id),
      };
    });

    return NextResponse.json({
      serrucho,
      participants,
      expenses,
      snapshots: enrichedSnapshots,
      logs,
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await assertWritePermission(id, req);
    const body = await req.json();
    const updated = await SerruchoService.update(id, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await assertWritePermission(id, req);
    const success = await SerruchoService.delete(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return handleApiError(err);
  }
}

