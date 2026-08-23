import { NextRequest, NextResponse } from "next/server";
import { IncomeService } from "@/features/incomes/service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; incomeId: string }> }
) {
  try {
    const { incomeId } = await params;
    const body = await req.json();
    const updated = await IncomeService.update(incomeId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar ingreso" }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  params: { params: Promise<{ id: string; incomeId: string }> }
) {
  return PATCH(req, params);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; incomeId: string }> }
) {
  try {
    const { incomeId } = await params;
    const success = await IncomeService.delete(incomeId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
