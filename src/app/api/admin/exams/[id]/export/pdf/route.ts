import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { prisma } from "@/server/db/prisma";
import { getAdminOrRedirect } from "@/lib/admin-session";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 40;
const TOP_MARGIN = 44;
const BOTTOM_MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

function safeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function sanitizeWinAnsi(text: string) {
  if (!text) return "";
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u2192]/g, "->")
    .replace(/[\u2190]/g, "<-")
    .replace(/[\u2022]/g, "*")
    .replace(/[^\x00-\xFF]/g, " ");
}

function splitLines(text: string, font: PDFFont, size: number, maxWidth: number) {
  const normalized = sanitizeWinAnsi(text).replace(/\r/g, "");
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
      if (current) lines.push(current);
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
    if (current) lines.push(current);
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
    if (cursorY - height < BOTTOM_MARGIN) addPage();
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
        page.drawText(line, { x: MARGIN_X, y: cursorY, size, font, color });
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

  return { paragraph, heading, divider };
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await getAdminOrRedirect();

  const { id } = await context.params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      discipline: true,
      classGroup: true,
      questions: {
        orderBy: { position: "asc" },
        include: {
          question: {
            include: {
              options: {
                orderBy: { position: "asc" }
              }
            }
          }
        }
      }
    }
  });

  if (!exam) {
    return NextResponse.json({ error: "Prova não encontrada." }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const fonts = {
    title: await pdf.embedFont(StandardFonts.HelveticaBold),
    body: await pdf.embedFont(StandardFonts.Helvetica),
    mono: await pdf.embedFont(StandardFonts.Courier)
  };
  const writer = createWriter(pdf, fonts);

  writer.heading("Caderno de Questões", 1);
  writer.paragraph(`${exam.title} · Código ${exam.publicCode}`, {
    size: 12,
    color: rgb(0.31, 0.36, 0.43),
    gapAfter: 4
  });
  writer.paragraph(`Disciplina: ${exam.discipline.name} | Turma alvo: ${exam.classGroup?.name || "Geral"}`);
  writer.paragraph(exam.description ? `Descrição: ${exam.description}` : "Sem descrição");
  writer.paragraph(exam.instructions ? `Instruções: ${exam.instructions}` : "Sem instruções");

  writer.divider();

  for (const eq of exam.questions) {
    const question = eq.question;
    writer.heading(`Questão ${eq.position} (${question.code})`, 3);

    if (question.context) {
      writer.paragraph(`Contexto: ${question.context}`);
    }

    if (question.visualSupportType === "CODE" && question.supportCode) {
      writer.paragraph("Suporte (Código):");
      writer.paragraph(question.supportCode, {
        font: fonts.mono,
        size: 9,
        gapAfter: 10
      });
    } else if (question.supportImageName || question.supportFileName) {
      writer.paragraph(`Suporte visual anexo: ${question.supportImageName || question.supportFileName}`, { color: rgb(0.4, 0.4, 0.4) });
    }

    writer.paragraph(`${question.statement}`);

    if (question.type === "MULTIPLE_CHOICE" && question.options.length > 0) {
      for (const option of question.options) {
        writer.paragraph(`[  ] ${option.label}) ${option.content}`, { gapAfter: 4 });
      }
    } else if (question.type === "SHORT_TEXT") {
      writer.paragraph("Resposta curta: ______________________________________________________________", { gapAfter: 20 });
    } else if (question.type === "LONG_TEXT") {
      writer.paragraph("Resposta livre:\n\n\n\n", { gapAfter: 40 });
    } else if (question.type === "FILE_UPLOAD") {
      writer.paragraph("[ ENVIAR ARQUIVO COMO RESPOSTA ]", { gapAfter: 10 });
    }

    writer.divider();
  }

  const bytes = await pdf.save();
  const filename = `caderno-questoes-${safeFilenamePart(exam.publicCode || exam.title)}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
