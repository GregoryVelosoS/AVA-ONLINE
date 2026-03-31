export type CatalogImportEntity = "disciplines" | "themes" | "class-groups";

export type CatalogImportDiscipline = {
  code: string;
  name: string;
};

export type CatalogImportTheme = {
  code: string;
  name: string;
  description?: string;
};

export type CatalogImportClassGroup = {
  code: string;
  name: string;
  disciplineId?: string;
  disciplineCode?: string;
  disciplineName?: string;
};

export type CatalogImportItemMap = {
  "class-groups": CatalogImportClassGroup;
  disciplines: CatalogImportDiscipline;
  themes: CatalogImportTheme;
};

export type CatalogImportPreviewError = {
  index: number;
  message: string;
};

export type CatalogImportPreviewResult<TItem> = {
  errors: CatalogImportPreviewError[];
  items: TItem[];
};

export type CatalogImportDisciplineLookup = {
  code?: string;
  id: string;
  name: string;
};

export const catalogImportLabels: Record<
  CatalogImportEntity,
  { plural: string; singular: string }
> = {
  disciplines: {
    plural: "disciplinas",
    singular: "disciplina"
  },
  themes: {
    plural: "temas",
    singular: "tema"
  },
  "class-groups": {
    plural: "turmas",
    singular: "turma"
  }
};

export const catalogImportTemplates: Record<CatalogImportEntity, Record<string, string>[]> = {
  disciplines: [
    {
      code: "LOGICA",
      name: "Lógica de Programação"
    }
  ],
  themes: [
    {
      code: "OPERADORES",
      name: "Operadores",
      description: "Conteúdos sobre operadores aritméticos e lógicos."
    }
  ],
  "class-groups": [
    {
      code: "TDS-1A",
      name: "Técnico em Desenvolvimento de Sistemas 1A",
      disciplineCode: "LOGICA",
      disciplineName: "Lógica de Programação"
    }
  ]
};

export const catalogImportInstructions: Record<CatalogImportEntity, string[]> = {
  disciplines: [
    "Preencha `code` e `name` em todas as linhas.",
    "Evite repetir código ou nome já existente na base.",
    "Use JSON em array ou uma única planilha com a primeira aba preenchida."
  ],
  themes: [
    "Preencha `code` e `name`; `description` é opcional.",
    "Códigos e nomes repetidos serão rejeitados.",
    "A descrição pode detalhar o conteúdo ou objetivo pedagógico."
  ],
  "class-groups": [
    "Preencha `code` e `name` em todas as linhas.",
    "Para vínculo com disciplina, use `disciplineId`, `disciplineCode` ou `disciplineName`.",
    "Se a turma não tiver disciplina fixa, deixe os campos de disciplina vazios."
  ]
};

function readValue(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function resolveDiscipline(
  source: Record<string, unknown>,
  disciplines: CatalogImportDisciplineLookup[]
) {
  const rawValue = readValue(source, [
    "disciplineId",
    "disciplinaId",
    "disciplineCode",
    "disciplinaCodigo",
    "disciplineName",
    "disciplina",
    "disciplinaNome"
  ]);

  if (!rawValue) {
    return { disciplineCode: "", disciplineId: "", disciplineName: "", rawValue: "" };
  }

  const normalized = rawValue.toLowerCase();
  const found = disciplines.find(
    (discipline) =>
      discipline.id.toLowerCase() === normalized ||
      discipline.name.toLowerCase() === normalized ||
      discipline.code?.toLowerCase() === normalized
  );

  return {
    disciplineCode: found?.code ?? "",
    disciplineId: found?.id ?? "",
    disciplineName: found?.name ?? rawValue,
    rawValue
  };
}

function previewDisciplines(
  rows: Record<string, unknown>[]
): CatalogImportPreviewResult<CatalogImportDiscipline> {
  const items: CatalogImportDiscipline[] = [];
  const errors: CatalogImportPreviewError[] = [];

  rows.forEach((row, index) => {
    const code = readValue(row, ["code", "codigo"]);
    const name = readValue(row, ["name", "nome"]);

    if (!code || !name) {
      errors.push({
        index,
        message: "Informe código e nome."
      });
      return;
    }

    items.push({ code, name });
  });

  return { errors, items };
}

function previewThemes(rows: Record<string, unknown>[]): CatalogImportPreviewResult<CatalogImportTheme> {
  const items: CatalogImportTheme[] = [];
  const errors: CatalogImportPreviewError[] = [];

  rows.forEach((row, index) => {
    const code = readValue(row, ["code", "codigo"]);
    const name = readValue(row, ["name", "nome"]);
    const description = readValue(row, ["description", "descricao", "descrição"]);

    if (!code || !name) {
      errors.push({
        index,
        message: "Informe código e nome."
      });
      return;
    }

    items.push({ code, description, name });
  });

  return { errors, items };
}

function previewClassGroups(
  rows: Record<string, unknown>[],
  disciplines: CatalogImportDisciplineLookup[]
): CatalogImportPreviewResult<CatalogImportClassGroup> {
  const items: CatalogImportClassGroup[] = [];
  const errors: CatalogImportPreviewError[] = [];

  rows.forEach((row, index) => {
    const code = readValue(row, ["code", "codigo"]);
    const name = readValue(row, ["name", "nome"]);
    const resolvedDiscipline = resolveDiscipline(row, disciplines);

    if (!code || !name) {
      errors.push({
        index,
        message: "Informe código e nome."
      });
      return;
    }

    if (resolvedDiscipline.rawValue && !resolvedDiscipline.disciplineId) {
      errors.push({
        index,
        message: `Disciplina "${resolvedDiscipline.rawValue}" não encontrada.`
      });
      return;
    }

    items.push({
      code,
      disciplineCode: resolvedDiscipline.disciplineCode || undefined,
      disciplineId: resolvedDiscipline.disciplineId || undefined,
      disciplineName: resolvedDiscipline.disciplineName || undefined,
      name
    });
  });

  return { errors, items };
}

export function buildCatalogImportPreview<TItem extends CatalogImportEntity>(
  entity: TItem,
  rows: Record<string, unknown>[],
  disciplines: CatalogImportDisciplineLookup[] = []
): CatalogImportPreviewResult<CatalogImportItemMap[TItem]> {
  if (entity === "disciplines") {
    return previewDisciplines(rows) as CatalogImportPreviewResult<CatalogImportItemMap[TItem]>;
  }

  if (entity === "themes") {
    return previewThemes(rows) as CatalogImportPreviewResult<CatalogImportItemMap[TItem]>;
  }

  return previewClassGroups(rows, disciplines) as CatalogImportPreviewResult<CatalogImportItemMap[TItem]>;
}
