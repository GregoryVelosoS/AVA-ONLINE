import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireAdminSession } from "@/server/auth/guards";
import { getExamAnalytics } from "@/server/services/analytics";

function drawWrappedText(page: import("pdf-lib").PDFPage, text: string, x: number, y: number, width: number, size: number, font: import("pdf-lib").PDFFont) {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    const lineWidth = font.widthOfTextAtSize(nextLine, size);

    if (lineWidth > width && line) {
      page.drawText(line, { x, y: currentY, size, font, color: rgb(0.1, 0.1, 0.1) });
      currentY -= size + 4;
      line = word;
    } else {
      line = nextLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color: rgb(0.1, 0.1, 0.1) });
  }

  return currentY - size - 8;
}

export async function GET(request: NextRequest) {
  await requireAdminSession();
  const examId = request.nextUrl.searchParams.get("examId");

  if (!examId) {
    return NextResponse.json({ error: "Selecione uma prova para exportar." }, { status: 400 });
  }

  const analytics = await getExamAnalytics({ examId });
  if (!analytics.selectedExam || !analytics.summary) {
    return NextResponse.json({ error: "Relatório não encontrado." }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.76, 0.07, 0.12) });
  page.drawText("Relatório da Prova", { x: 40, y: 800, size: 24, font: titleFont, color: rgb(1, 1, 1) });
  page.drawText(`${analytics.selectedExam.title} · Código ${analytics.selectedExam.publicCode}`, {
    x: 40,
    y: 778,
    size: 12,
    font: bodyFont,
    color: rgb(1, 1, 1)
  });

  let y = 730;
  const sections = [
    `Disciplina: ${analytics.selectedExam.disciplineName}`,
    `Respondentes: ${analytics.summary.totalRespondents}`,
    `Concluíram: ${analytics.summary.completedStudents}`,
    `Média da prova: ${analytics.summary.averageScorePercent}%`,
    `Taxa geral de acerto: ${analytics.summary.accuracyRate}%`,
    `Tempo médio: ${analytics.summary.averageDurationMinutes} min`,
    analytics.questionHighlights?.criticalQuestion
      ? `Questão mais crítica: ${analytics.questionHighlights.criticalQuestion.code} (${analytics.questionHighlights.criticalQuestion.errorRate}% de erro)`
      : "Questão mais crítica: sem dados",
    analytics.strugglingStudents.length > 0
      ? `Alunos com maior dificuldade: ${analytics.strugglingStudents.map((student) => `${student.studentName} (${student.scorePercent}%)`).join(", ")}`
      : "Alunos com maior dificuldade: sem dados",
    analytics.feedbackAnalytics.difficultContents.length > 0
      ? `Conteúdos mais marcados como difíceis: ${analytics.feedbackAnalytics.difficultContents.map((item) => item.label).join(", ")}`
      : "Conteúdos mais marcados como difíceis: sem dados",
    analytics.feedbackAnalytics.scaleAverages.length > 0
      ? `Percepção média da turma: ${analytics.feedbackAnalytics.scaleAverages.map((item) => `${item.label} ${item.average}`).join(" · ")}`
      : "Percepção média da turma: sem respostas"
  ];

  for (const section of sections) {
    y = drawWrappedText(page, section, 40, y, 515, 12, bodyFont);
  }

  page.drawText("Resumo visual simplificado", {
    x: 40,
    y: y - 8,
    size: 14,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.1)
  });

  const chartTop = y - 40;
  const bars = analytics.scoreDistribution.length > 0 ? analytics.scoreDistribution : [{ label: "Sem dados", value: 0 }];
  const maxValue = Math.max(...bars.map((item) => item.value), 1);

  bars.forEach((bar, index) => {
    const x = 50 + index * 110;
    const height = (bar.value / maxValue) * 110;
    page.drawRectangle({ x, y: chartTop, width: 70, height, color: rgb(0.76, 0.07, 0.12) });
    page.drawText(bar.label, { x, y: chartTop - 18, size: 10, font: bodyFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(String(bar.value), { x: x + 24, y: chartTop + height + 6, size: 10, font: bodyFont, color: rgb(0.2, 0.2, 0.2) });
  });

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-${analytics.selectedExam.publicCode}.pdf"`
    }
  });
}
