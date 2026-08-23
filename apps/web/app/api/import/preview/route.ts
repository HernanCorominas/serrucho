import { NextRequest, NextResponse } from "next/server";
import { ImportService } from "@/features/import/service";
import { handleApiError } from "@/lib/security/permissions";

export async function POST(req: NextRequest) {
  try {
    let csvContent = "";
    let defaultCurrency = "DOP";
    let serruchoName = "Serrucho Importado";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No se proporcionó ningún archivo CSV" }, { status: 400 });
      }
      csvContent = await file.text();
      defaultCurrency = (formData.get("currency") as string) || "DOP";
      serruchoName = (formData.get("serruchoName") as string) || file.name.replace(/\.[^/.]+$/, "");
    } else {
      const body = await req.json();
      csvContent = body.csvContent || "";
      defaultCurrency = body.defaultCurrency || "DOP";
      serruchoName = body.serruchoName || "Serrucho Importado";
    }

    const preview = await ImportService.parseAndPreview(csvContent, {
      defaultCurrency,
      serruchoName,
    });

    return NextResponse.json(preview);
  } catch (err: any) {
    return handleApiError(err);
  }
}
