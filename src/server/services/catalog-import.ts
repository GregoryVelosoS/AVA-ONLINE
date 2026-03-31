import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import type {
  CatalogImportClassGroup,
  CatalogImportDiscipline,
  CatalogImportEntity,
  CatalogImportItemMap,
  CatalogImportPreviewError,
  CatalogImportTheme
} from "@/lib/catalog-import";

type ValidationResult = {
  errors: CatalogImportPreviewError[];
  validItems: CatalogImportItemMap[CatalogImportEntity][];
};

function normalizeKey(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function buildError(index: number, message: string) {
  return { index, message };
}

async function validateDisciplines(items: CatalogImportDiscipline[]): Promise<ValidationResult> {
  const existing = await prisma.discipline.findMany({
    select: {
      code: true,
      name: true
    }
  });

  const existingCodes = new Set(existing.map((item) => normalizeKey(item.code)));
  const existingNames = new Set(existing.map((item) => normalizeKey(item.name)));
  const batchCodes = new Set<string>();
  const batchNames = new Set<string>();
  const errors: CatalogImportPreviewError[] = [];
  const validItems: CatalogImportDiscipline[] = [];

  items.forEach((item, index) => {
    const codeKey = normalizeKey(item.code);
    const nameKey = normalizeKey(item.name);

    if (batchCodes.has(codeKey) || existingCodes.has(codeKey)) {
      errors.push(buildError(index, `Código "${item.code}" já cadastrado.`));
      return;
    }

    if (batchNames.has(nameKey) || existingNames.has(nameKey)) {
      errors.push(buildError(index, `Nome "${item.name}" já cadastrado.`));
      return;
    }

    batchCodes.add(codeKey);
    batchNames.add(nameKey);
    validItems.push(item);
  });

  return { errors, validItems };
}

async function validateThemes(items: CatalogImportTheme[]): Promise<ValidationResult> {
  const existing = await prisma.theme.findMany({
    select: {
      code: true,
      name: true
    }
  });

  const existingCodes = new Set(existing.map((item) => normalizeKey(item.code)));
  const existingNames = new Set(existing.map((item) => normalizeKey(item.name)));
  const batchCodes = new Set<string>();
  const batchNames = new Set<string>();
  const errors: CatalogImportPreviewError[] = [];
  const validItems: CatalogImportTheme[] = [];

  items.forEach((item, index) => {
    const codeKey = normalizeKey(item.code);
    const nameKey = normalizeKey(item.name);

    if (batchCodes.has(codeKey) || existingCodes.has(codeKey)) {
      errors.push(buildError(index, `Código "${item.code}" já cadastrado.`));
      return;
    }

    if (batchNames.has(nameKey) || existingNames.has(nameKey)) {
      errors.push(buildError(index, `Nome "${item.name}" já cadastrado.`));
      return;
    }

    batchCodes.add(codeKey);
    batchNames.add(nameKey);
    validItems.push(item);
  });

  return { errors, validItems };
}

async function validateClassGroups(items: CatalogImportClassGroup[]): Promise<ValidationResult> {
  const existing = await prisma.classGroup.findMany({
    select: {
      code: true,
      disciplineId: true,
      name: true
    }
  });

  const existingCodes = new Set(existing.map((item) => normalizeKey(item.code)));
  const existingNames = new Set(existing.map((item) => `${normalizeKey(item.name)}::${normalizeKey(item.disciplineId)}`));
  const batchCodes = new Set<string>();
  const batchNames = new Set<string>();
  const errors: CatalogImportPreviewError[] = [];
  const validItems: CatalogImportClassGroup[] = [];

  items.forEach((item, index) => {
    const codeKey = normalizeKey(item.code);
    const nameKey = `${normalizeKey(item.name)}::${normalizeKey(item.disciplineId)}`;

    if (batchCodes.has(codeKey) || existingCodes.has(codeKey)) {
      errors.push(buildError(index, `Código "${item.code}" já cadastrado.`));
      return;
    }

    if (batchNames.has(nameKey) || existingNames.has(nameKey)) {
      errors.push(buildError(index, `Já existe turma "${item.name}" para a mesma disciplina.`));
      return;
    }

    batchCodes.add(codeKey);
    batchNames.add(nameKey);
    validItems.push(item);
  });

  return { errors, validItems };
}

export async function validateCatalogImport<TItem extends CatalogImportEntity>(
  entity: TItem,
  items: CatalogImportItemMap[TItem][]
) {
  if (entity === "disciplines") {
    return validateDisciplines(items as CatalogImportDiscipline[]);
  }

  if (entity === "themes") {
    return validateThemes(items as CatalogImportTheme[]);
  }

  return validateClassGroups(items as CatalogImportClassGroup[]);
}

export async function importCatalogItems<TItem extends CatalogImportEntity>(
  entity: TItem,
  items: CatalogImportItemMap[TItem][]
) {
  if (entity === "disciplines") {
    const result = await prisma.discipline.createMany({
      data: (items as CatalogImportDiscipline[]).map((item) => ({
        code: item.code,
        name: item.name
      }))
    });

    return { count: result.count };
  }

  if (entity === "themes") {
    const result = await prisma.theme.createMany({
      data: (items as CatalogImportTheme[]).map((item) => ({
        code: item.code,
        description: item.description || null,
        name: item.name
      }))
    });

    return { count: result.count };
  }

  const result = await prisma.classGroup.createMany({
    data: (items as CatalogImportClassGroup[]).map((item) => ({
      code: item.code,
      disciplineId: item.disciplineId || null,
      name: item.name
    }))
  });

  return { count: result.count };
}

export function isPrismaKnownRequestError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}
