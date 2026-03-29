import { PrismaClient, QuestionType, Difficulty, QuestionStatus, ExamStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@ava.local" },
    update: {
      name: "Administrador",
      role: "ADM",
      isActive: true
    },
    create: {
      name: "Administrador",
      email: "admin@ava.local",
      passwordHash,
      role: "ADM"
    }
  });

  const discipline = await prisma.discipline.upsert({
    where: { code: "LOG" },
    update: {},
    create: {
      code: "LOG",
      name: "Lógica de Programação"
    }
  });

  const tag = await prisma.tag.upsert({
    where: { label: "#OP-ARIT" },
    update: {},
    create: { label: "#OP-ARIT", color: "#1d4ed8" }
  });

  const question = await prisma.question.upsert({
    where: { code: "Q-001" },
    update: {},
    create: {
      code: "Q-001",
      type: QuestionType.MULTIPLE_CHOICE,
      disciplineId: discipline.id,
      subject: "Operadores",
      topic: "Aritméticos",
      difficulty: Difficulty.EASY,
      context: "No VisualG, calcular resto da divisão de 15 por 4.",
      statement: "Qual expressão retorna o resto correto?",
      defaultWeight: 1,
      status: QuestionStatus.ACTIVE,
      createdBy: admin.id,
      options: {
        create: [
          { label: "A", content: "resultado <- 15 / 4", isCorrect: false, position: 1 },
          { label: "B", content: "resultado <- 15 div 4", isCorrect: false, position: 2 },
          { label: "C", content: "resultado <- 15 % 4", isCorrect: false, position: 3 },
          { label: "D", content: "resultado <- 15 mod 4", isCorrect: true, position: 4 }
        ]
      }
    }
  });

  await prisma.questionTag.upsert({
    where: { questionId_tagId: { questionId: question.id, tagId: tag.id } },
    update: {},
    create: { questionId: question.id, tagId: tag.id }
  });

  const exam = await prisma.exam.upsert({
    where: { id: "demo-exam-id" },
    update: {},
    create: {
      id: "demo-exam-id",
      title: "Prova Diagnóstica de Lógica",
      publicCode: "DEMO2026",
      description: "Versão de demonstração",
      disciplineId: discipline.id,
      instructions: "Leia com atenção e selecione uma alternativa.",
      startAt: new Date("2025-01-01T00:00:00.000Z"),
      endAt: new Date("2030-01-01T00:00:00.000Z"),
      status: ExamStatus.PUBLISHED,
      createdBy: admin.id,
      questions: {
        create: [{ questionId: question.id, position: 1 }]
      },
      publicLinks: {
        create: [{ slug: "demo2026", isActive: true }]
      }
    }
  });

  console.log("Seed concluído", { admin: admin.email, exam: exam.title });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
