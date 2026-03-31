import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { catalogImportEntitySchema } from "@/server/validators/schemas";
import { requireAdminSession } from "@/server/auth/guards";
import { catalogImportLabels, catalogImportTemplates } from "@/lib/catalog-import";

export async function GET(request: NextRequest) {
  await requireAdminSession();

  const entityResult = catalogImportEntitySchema.safeParse(request.nextUrl.searchParams.get("entity"));

  if (!entityResult.success) {
    return NextResponse.json({ error: "Entidade de importação inválida." }, { status: 400 });
  }

  const entity = entityResult.data;
  const format = request.nextUrl.searchParams.get("format");
  const fileBaseName = `modelo-importacao-${catalogImportLabels[entity].plural}`;
  const rows = catalogImportTemplates[entity];

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, catalogImportLabels[entity].plural);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileBaseName}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    });
  }

  return new NextResponse(JSON.stringify(rows, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="${fileBaseName}.json"`,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
