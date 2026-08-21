import { NextRequest, NextResponse } from "next/server";
import { SerruchoService } from "@/features/serruchos/service";
import { getRepository } from "@/lib/store";

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await SerruchoService.delete(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
