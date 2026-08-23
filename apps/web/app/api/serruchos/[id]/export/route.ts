import { NextRequest, NextResponse } from "next/server";
import { ExportService } from "@/features/export/service";
import { handleApiError } from "@/lib/security/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "xlsx").toLowerCase();
    const sheet = (searchParams.get("sheet") || "Movimientos") as
      | "Resumen"
      | "Movimientos"
      | "Liquidacion"
      | "Historial";

    if (format === "csv") {
      const { csv, filename } = await ExportService.exportToCSV(id, sheet);
      // Prepend UTF-8 BOM so Excel opens Spanish accents cleanly
      const csvWithBOM = "\uFEFF" + csv;
      return new NextResponse(csvWithBOM, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // Default: XLSX
    const { buffer, filename } = await ExportService.exportToXLSXBuffer(id);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
