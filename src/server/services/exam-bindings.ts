import { prisma } from "@/server/db/prisma";

type ExamBindingInput = {
  disciplineId: string;
  targetClassGroupId: string;
  themeIds?: string[];
};

export async function getExamBindingValidationError({
  disciplineId,
  targetClassGroupId,
  themeIds = []
}: ExamBindingInput) {
  const [discipline, classGroup, themeCount] = await Promise.all([
    prisma.discipline.findUnique({
      where: { id: disciplineId },
      select: { id: true }
    }),
    prisma.classGroup.findUnique({
      where: { id: targetClassGroupId },
      select: { id: true, disciplineId: true, name: true }
    }),
    themeIds.length > 0
      ? prisma.theme.count({
          where: {
            id: {
              in: Array.from(new Set(themeIds))
            }
          }
        })
      : Promise.resolve(0)
  ]);

  if (!discipline) {
    return "Disciplina não encontrada.";
  }

  if (!classGroup) {
    return "Turma vinculada não encontrada.";
  }

  if (classGroup.disciplineId && classGroup.disciplineId !== disciplineId) {
    return `A turma ${classGroup.name} está vinculada a outra disciplina.`;
  }

  if (themeIds.length > 0 && themeCount !== Array.from(new Set(themeIds)).length) {
    return "Um ou mais temas selecionados não foram encontrados.";
  }

  return null;
}
