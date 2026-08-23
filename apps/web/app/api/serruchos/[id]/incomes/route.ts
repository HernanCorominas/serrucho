import { NextRequest, NextResponse } from "next/server";
import { IncomeService } from "@/features/incomes/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incomes = await IncomeService.listBySerrucho(id);
    return NextResponse.json(incomes);
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
    const body = await req.json();
    const created = await IncomeService.add(id, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

