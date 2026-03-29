import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdminSession } from "@/server/auth/guards";

const sampleRows = [
  {
    code: "Q-101",
    title: "Operadores aritméticos",
    type: "MULTIPLE_CHOICE",
    subject: "Algoritmos",
    topic: "Operadores",
    discipline: "Lógica de Programação",
    context: "Considere uma linguagem com operador mod para obter o resto da divisão.",
    visualSupportType: "CODE",
    supportCode: "const resto = 15 % 4;",
    statement: "Qual expressão retorna o resto da divisão de 15 por 4?",
    expectedFeedback: "Revise operadores aritméticos básicos e o conceito de resto da divisão.",
    answerExplanation: "O operador de módulo retorna o resto da divisão inteira.",
    studyTopics: "Operadores aritméticos\nMódulo (%)",
    studyLinks: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Operators/Remainder",
    referencePlaylist: "https://youtube.com/playlist?list=EXEMPLO",
    complementaryNotes: "Reforce a diferença entre divisão comum e operador de módulo.",
    difficulty: "EASY",
    defaultWeight: 1,
    status: "ACTIVE",
    alternativeA: "15 / 4",
    alternativeB: "15 div 4",
    alternativeC: "15 mod 4",
    alternativeD: "",
    alternativeE: "",
    correctAlternative: "C",
    supportImagePath: "",
    supportFilePath: ""
  }
];

export async function GET(request: NextRequest) {
  await requireAdminSession();

  const format = request.nextUrl.searchParams.get("format");

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questoes");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="modelo-importacao-questoes.xlsx"'
      }
    });
  }

  return new NextResponse(JSON.stringify(sampleRows, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modelo-importacao-questoes.json"'
    }
  });
}
