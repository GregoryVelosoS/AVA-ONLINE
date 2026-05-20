import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdminSession } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { questionImportSchema } from "@/server/validators/schemas";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const parsed = questionImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos para importação de questões.", details: parsed.error.flatten() }, { status: 400 });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: {
        id: session.sub
      },
      select: {
        id: true
      }
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Sessão administrativa inválida ou expirada. Faça login novamente." }, { status: 401 });
    }

    const normalizedCodes = parsed.data.questions.map((question) => question.code.trim().toLowerCase());
    const duplicatedCode = normalizedCodes.find((code, index) => normalizedCodes.indexOf(code) !== index);

    if (duplicatedCode) {
      const duplicateQuestion = parsed.data.questions.find((question) => question.code.trim().toLowerCase() === duplicatedCode);
      return NextResponse.json({ error: `Código "${duplicateQuestion?.code ?? duplicatedCode}" repetido no arquivo de importação.` }, { status: 400 });
    }

    const existingQuestion = await prisma.question.findFirst({
      where: {
        code: {
          in: parsed.data.questions.map((question) => question.code)
        }
      },
      select: {
        code: true
      }
    });

    if (existingQuestion) {
      return NextResponse.json({ error: `Código "${existingQuestion.code}" já cadastrado.` }, { status: 409 });
    }

    const disciplineIds = Array.from(new Set(parsed.data.questions.map((question) => question.disciplineId)));
    const disciplineCount = await prisma.discipline.count({
      where: {
        id: {
          in: disciplineIds
        }
      }
    });

    if (disciplineCount !== disciplineIds.length) {
      return NextResponse.json({ error: "Uma ou mais disciplinas das questões não foram encontradas." }, { status: 400 });
    }

    const created = await prisma.$transaction(
      parsed.data.questions.map((question) =>
        prisma.question.create({
          data: {
            code: question.code,
            title: question.title || null,
            type: question.type,
            disciplineId: question.disciplineId,
            subject: question.subject,
            topic: question.topic || null,
            difficulty: question.difficulty,
            context: question.context || null,
            statement: question.statement,
            visualSupportType: question.visualSupportType,
            supportCode: question.supportCode || null,
            expectedFeedback: question.expectedFeedback || null,
            answerExplanation: question.answerExplanation || null,
            studyTopics: question.studyTopics || null,
            studyLinks: question.studyLinks || null,
            referencePlaylist: question.referencePlaylist || null,
            complementaryNotes: question.complementaryNotes || null,
            supportImagePath: question.supportImagePath || null,
            supportImageName: question.supportImageName || null,
            supportImageMime: question.supportImageMime || null,
            supportFilePath: question.supportFilePath || null,
            supportFileName: question.supportFileName || null,
            supportFileMime: question.supportFileMime || null,
            defaultWeight: question.defaultWeight,
            status: question.status,
            createdBy: session.sub,
            options:
              question.type === "MULTIPLE_CHOICE"
                ? {
                    create: question.options.map((option) => ({
                      label: option.label,
                      content: option.content,
                      isCorrect: option.isCorrect,
                      position: option.position
                    }))
                  }
                : undefined
          }
        })
      )
    );

    return NextResponse.json({ count: created.length }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Sessão administrativa inválida ou expirada." }, { status: 401 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "O corpo da requisição não contém um JSON válido." }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma questão cadastrada com um dos códigos informados." }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Não foi possível vincular a questão ao usuário ou disciplina informados." }, { status: 400 });
    }

    console.error("Question import failed", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production" || !(error instanceof Error)
            ? "Não foi possível importar as questões."
            : `Não foi possível importar as questões: ${error.message}`
      },
      { status: 500 }
    );
  }
}
