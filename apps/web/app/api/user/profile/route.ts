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

    const profile = await AuthService.getProfile(userId);
    return NextResponse.json({ profile });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.id || req.headers.get("x-user-id");

    if (!userId || !body.email) {
      return NextResponse.json(
        { error: "Se requieren id y email de usuario" },
        { status: 400 }
      );
    }

    const updated = await AuthService.upsertProfile({
      id: userId,
      email: body.email,
      full_name: body.full_name,
      phone: body.phone,
      avatar_url: body.avatar_url,
      default_payment_instructions: body.default_payment_instructions,
    });

    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    return handleApiError(err);
  }
}
