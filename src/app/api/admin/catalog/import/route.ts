import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { importCatalogItems, isPrismaKnownRequestError, validateCatalogImport } from "@/server/services/catalog-import";
import { catalogImportSchema } from "@/server/validators/schemas";

export async function POST(request: NextRequest) {
  await requireAdminSession();

  const body = await request.json();
  const parsed = catalogImportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const validation = await validateCatalogImport(parsed.data.entity, parsed.data.items);

  if (validation.errors.length > 0) {
    return NextResponse.json(
      {
        error: "Foram encontrados itens inválidos na importação.",
        itemErrors: validation.errors
      },
      { status: 400 }
    );
  }

  try {
    const result = await importCatalogItems(parsed.data.entity, parsed.data.items);

    return NextResponse.json(
      {
        count: result.count
      },
      { status: 201 }
    );
  } catch (error) {
    if (isPrismaKnownRequestError(error)) {
      return NextResponse.json(
        {
          error: "Não foi possível concluir a importação por conflito de dados existentes."
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Falha inesperada ao importar os dados."
      },
      { status: 500 }
    );
  }
}
