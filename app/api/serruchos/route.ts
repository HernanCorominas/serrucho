import { NextRequest, NextResponse } from "next/server";
import { SerruchoService } from "@/features/serruchos/service";

export async function GET() {
  try {
    const ownerId = "demo-user-1"; // MVP default owner for instant testing
    const list = await SerruchoService.listByOwner(ownerId);
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ownerId = "demo-user-1";
    const created = await SerruchoService.create(ownerId, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
