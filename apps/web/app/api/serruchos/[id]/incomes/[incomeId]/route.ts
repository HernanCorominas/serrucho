import { NextRequest, NextResponse } from "next/server";
import { IncomeService } from "@/features/incomes/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incomeId: string }> }
) {
  try {
    const { id, incomeId } = await params;
    await assertWritePermission(id, req);
    const body = await req.json();
    const updated = await IncomeService.update(incomeId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  params: { params: Promise<{ id: string; incomeId: string }> }
) {
  return PATCH(req, params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incomeId: string }> }
) {
  try {
    const { id, incomeId } = await params;
    await assertWritePermission(id, req);
    const success = await IncomeService.delete(incomeId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return handleApiError(err);
  }
}

