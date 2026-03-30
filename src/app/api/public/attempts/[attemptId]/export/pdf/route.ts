import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { getAttemptResultSummary } from "@/server/services/attempt-result";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 40;
const TOP_MARGIN = 44;
const BOTTOM_MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(value);
}

function formatDuration(durationSeconds: number) {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}min ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function safeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function confidenceLabel(level: number | null) {
  if (level === 1) return "1 - Chutei";
  if (level === 2) return "2 - Tive duvida";
  if (level === 3) return "3 - Tenho certeza";
  return "Nao informado";
}

function questionStatusLabel(status: "correct" | "incorrect" | "pending" | "unanswered") {
  if (status === "correct") return "Acerto";
  if (status === "incorrect") return "Erro";
  if (status === "pending") return "Aguardando correcao";
  return "Nao respondida";
}

function visualSupportSummary(question: {
  visualSupportType: "NONE" | "ASSET" | "CODE";
  supportCode: string | null;
  supportImageName: string | null;
  supportImageUrl: string | null;
  supportFileName: string | null;
  supportFileUrl: string | null;
}) {
  const lines: string[] = [];

  if (question.visualSupportType === "CODE" && question.supportCode) {
    lines.push("Bloco de codigo incluso abaixo.");
  }

  if (question.supportImageName || question.supportImageUrl) {
    lines.push(`Imagem de apoio: ${question.supportImageName || question.supportImageUrl}`);
  }

  if (question.supportFileName || question.supportFileUrl) {
    lines.push(`Arquivo complementar: ${question.supportFileName || question.supportFileUrl}`);
  }

  return lines.length > 0 ? lines.join(" ") : "Sem suporte visual.";
}

function selectedAnswerText(question: {
  type: "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "FILE_UPLOAD";
  selectedOptionLabel: string | null;
  selectedOptionContent: string | null;
  shortTextAnswer: string | null;
  longTextAnswer: string | null;
}) {
  if (question.type === "MULTIPLE_CHOICE") {
    return question.selectedOptionLabel
      ? `${question.selectedOptionLabel}) ${question.selectedOptionContent || ""}`.trim()
      : "Nao respondida";
  }

  if (question.shortTextAnswer || question.longTextAnswer) {
    return question.shortTextAnswer || question.longTextAnswer || "";
  }

  if (question.type === "FILE_UPLOAD") {
    return "Questao de envio de arquivo ou resposta manual.";
  }

  return "Nao respondida";
}

function splitLines(text: string, font: PDFFont, size: number, maxWidth: number) {
  const normalized = text.replace(/\r/g, "");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) {
        lines.push(current);
      }

      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word;
        continue;
      }

      let chunk = "";
      for (const char of word) {
        const nextChunk = `${chunk}${char}`;
        if (font.widthOfTextAtSize(nextChunk, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk = nextChunk;
        }
      }
      current = chunk;
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

function createWriter(pdf: PDFDocument, fonts: { title: PDFFont; body: PDFFont; mono: PDFFont }) {
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - TOP_MARGIN;

  function addPage() {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursorY = PAGE_HEIGHT - TOP_MARGIN;
  }

  function ensureSpace(height: number) {
    if (cursorY - height < BOTTOM_MARGIN) {
      addPage();
    }
  }

  function paragraph(text: string, options?: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; gapAfter?: number }) {
    const size = options?.size ?? 11;
    const font = options?.font ?? fonts.body;
    const color = options?.color ?? rgb(0.13, 0.15, 0.23);
    const gapAfter = options?.gapAfter ?? 8;
    const lineHeight = size + 4;
    const lines = splitLines(text, font, size, CONTENT_WIDTH);

    for (const line of lines) {
      ensureSpace(lineHeight);
      if (line) {
        page.drawText(line, {
          x: MARGIN_X,
          y: cursorY,
          size,
          font,
          color
        });
      }
      cursorY -= lineHeight;
    }

    cursorY -= gapAfter;
  }

  function heading(text: string, level: 1 | 2 | 3 = 2) {
    const size = level === 1 ? 22 : level === 2 ? 16 : 13;
    ensureSpace(size + 20);
    paragraph(text, {
      size,
      font: fonts.title,
      color: level === 1 ? rgb(0.76, 0.07, 0.12) : rgb(0.06, 0.06, 0.08),
      gapAfter: level === 1 ? 10 : 6
    });
  }

  function divider() {
    ensureSpace(18);
    page.drawLine({
      start: { x: MARGIN_X, y: cursorY + 6 },
      end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY + 6 },
      thickness: 1,
      color: rgb(0.88, 0.9, 0.93)
    });
    cursorY -= 12;
  }

  function badge(text: string, tone: "success" | "error" | "warning" | "neutral") {
    const width = fonts.body.widthOfTextAtSize(text, 10) + 18;
    const colors =
      tone === "success"
        ? { fill: rgb(0.91, 0.98, 0.94), text: rgb(0.02, 0.45, 0.23), border: rgb(0.6, 0.9, 0.69) }
        : tone === "error"
          ? { fill: rgb(1, 0.94, 0.94), text: rgb(0.76, 0.07, 0.12), border: rgb(0.97, 0.78, 0.78) }
          : tone === "warning"
            ? { fill: rgb(1, 0.97, 0.89), text: rgb(0.67, 0.43, 0.07), border: rgb(0.97, 0.88, 0.66) }
            : { fill: rgb(0.96, 0.97, 0.98), text: rgb(0.31, 0.36, 0.43), border: rgb(0.86, 0.89, 0.92) };

    ensureSpace(28);
    page.drawRectangle({
      x: MARGIN_X,
      y: cursorY - 4,
      width,
      height: 20,
      color: colors.fill,
      borderColor: colors.border,
      borderWidth: 1
    });
    page.drawText(text, {
      x: MARGIN_X + 9,
      y: cursorY + 2,
      size: 10,
      font: fonts.title,
      color: colors.text
    });
    cursorY -= 24;
  }

  return { paragraph, heading, divider, badge };
}

export async function GET(_: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params;
  const result = await getAttemptResultSummary(attemptId);

  if (!result) {
    return NextResponse.json({ error: "Tentativa nao encontrada." }, { status: 404 });
  }

  if (result.status === "STARTED" || result.status === "IN_PROGRESS") {
    return NextResponse.json({ error: "A prova ainda nao foi finalizada." }, { status: 409 });
  }

  const pdf = await PDFDocument.create();
  const fonts = {
    title: await pdf.embedFont(StandardFonts.HelveticaBold),
    body: await pdf.embedFont(StandardFonts.Helvetica),
    mono: await pdf.embedFont(StandardFonts.Courier)
  };
  const writer = createWriter(pdf, fonts);

  writer.heading("Resultado individual da prova", 1);
  writer.paragraph(`${result.exam.title} · Codigo ${result.exam.publicCode}`, {
    size: 12,
    color: rgb(0.31, 0.36, 0.43),
    gapAfter: 4
  });
  writer.paragraph(`Disciplina: ${result.exam.disciplineName}`);

  writer.heading("Dados gerais", 2);
  writer.paragraph(`Aluno: ${result.profile?.studentName || "Nao identificado"}`);
  writer.paragraph(`Turma: ${result.profile?.classGroupName || "Nao informada"}`);
  writer.paragraph(`Disciplina informada: ${result.profile?.disciplineInformed || result.exam.disciplineName}`);
  writer.paragraph(`Data e horario de realizacao: ${formatDateTime(result.submittedAt ?? result.startedAt)}`);
  writer.paragraph(`Tempo gasto: ${formatDuration(result.durationSeconds)}`);
  writer.paragraph(`Pontuacao final: ${formatScore(result.totalScore)} / ${formatScore(result.maxScore)}`);
  writer.paragraph(`Percentual de acerto: ${result.scorePercent}%`);
  writer.paragraph(`Totais: ${result.correctCount} acertos · ${result.incorrectCount} erros · ${result.pendingCount} pendentes`);

  writer.divider();
  writer.heading("Resultado por questao", 2);

  for (const question of result.questionResults) {
    writer.heading(`Questao ${question.position} - ${question.code}`, 3);
    writer.badge(
      questionStatusLabel(question.resultStatus),
      question.resultStatus === "correct"
        ? "success"
        : question.resultStatus === "incorrect"
          ? "error"
          : question.resultStatus === "pending"
            ? "warning"
            : "neutral"
    );

    if (question.context) {
      writer.paragraph(`Contexto: ${question.context}`);
    }

    writer.paragraph(`Suporte visual: ${visualSupportSummary(question)}`);

    if (question.visualSupportType === "CODE" && question.supportCode) {
      writer.paragraph(question.supportCode, {
        font: fonts.mono,
        size: 9,
        gapAfter: 10
      });
    }

    writer.paragraph(`Comando: ${question.statement}`);

    if (question.type === "MULTIPLE_CHOICE" && question.options.length > 0) {
      writer.paragraph("Alternativas:");
      for (const option of question.options) {
        const suffix = option.isCorrect ? " (correta)" : "";
        writer.paragraph(`${option.label}) ${option.content}${suffix}`, { gapAfter: 4 });
      }
    }

    writer.paragraph(`Resposta marcada: ${selectedAnswerText(question)}`);
    writer.paragraph(
      `Resposta correta: ${
        question.correctOptionLabel ? `${question.correctOptionLabel}) ${question.correctOptionContent || ""}`.trim() : "Correcao textual/manual"
      }`
    );
    writer.paragraph(`Nivel de confianca: ${confidenceLabel(question.confidenceLevel)}`);
    writer.paragraph(`Feedback esperado: ${question.expectedFeedback || "Sem feedback cadastrado."}`);
    writer.paragraph(`Explicacao da resposta: ${question.answerExplanation || "Sem explicacao cadastrada."}`);
    writer.paragraph(
      `Tema(s) para estudo: ${question.studyTopics.length > 0 ? question.studyTopics.join(", ") : "Nenhum tema especifico cadastrado."}`
    );
    writer.paragraph(
      `Materiais de apoio: ${question.referenceLinks.length > 0 ? question.referenceLinks.join(" | ") : "Nenhum material adicional cadastrado."}`
    );

    if (question.complementaryNotes) {
      writer.paragraph(`Observacoes complementares: ${question.complementaryNotes}`);
    }

    writer.divider();
  }

  writer.heading("Resumo final", 2);
  writer.paragraph(
    `Desempenho geral: ${result.correctCount} acertos, ${result.incorrectCount} erros, ${result.pendingCount} questoes aguardando correcao e ${result.scorePercent}% de aproveitamento.`
  );
  writer.paragraph(
    `Temas principais para revisar: ${result.consolidatedTopics.length > 0 ? result.consolidatedTopics.join(", ") : "Nenhum tema consolidado automaticamente."}`
  );
  writer.paragraph(
    `Materiais recomendados: ${result.consolidatedLinks.length > 0 ? result.consolidatedLinks.join(" | ") : "Nenhum material consolidado."}`
  );
  writer.paragraph("Use este documento como guia de revisao dos pontos em que houve erro, baixa confianca ou necessidade de correcao manual.");

  const bytes = await pdf.save();
  const filename = `resultado-${safeFilenamePart(result.exam.publicCode || result.exam.title)}-${safeFilenamePart(
    result.profile?.studentName || attemptId
  )}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
