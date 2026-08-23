import { NextRequest, NextResponse } from "next/server";
import { ExpenseService } from "@/features/expenses/service";
import { assertWritePermission, handleApiError } from "@/lib/security/permissions";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expId: string }> }
) {
  try {
    const { id, expId } = await params;
    await assertWritePermission(id, req);
    const body = await req.json();
    const updated = await ExpenseService.update(expId, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  params: { params: Promise<{ id: string; expId: string }> }
) {
  return PATCH(req, params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expId: string }> }
) {
  try {
    const { id, expId } = await params;
    await assertWritePermission(id, req);
    const success = await ExpenseService.delete(expId);
    return NextResponse.json({ success });
  } catch (err: any) {
    return handleApiError(err);
  }
}

