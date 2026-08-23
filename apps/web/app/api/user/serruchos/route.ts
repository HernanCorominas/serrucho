import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/features/auth/service";
import { handleApiError } from "@/lib/security/permissions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere ID de usuario" },
        { status: 400 }
      );
    }

    const serruchos = await AuthService.getUserSerruchos(userId);
    return NextResponse.json(serruchos);
  } catch (err: any) {
    return handleApiError(err);
  }
}
