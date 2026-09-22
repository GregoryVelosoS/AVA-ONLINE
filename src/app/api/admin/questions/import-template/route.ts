import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdminSession } from "@/server/auth/guards";

const sampleRows = [
  {
    "Nº": "1",
    "Curso": "Desenvolvimento de Sistemas",
    "Capacidade": "C1",
    "Descrição": "Utilizar aplicações e sistema operacional no desenvolvimento de documentação de sistemas web",
    "Função": "2 - Desenvolver sistemas computacionais, atendendo normas e padrão de qualidade",
    "Subfunção": "2.2 - Implantar sistemas",
    "OC": "1 - Softwares de escritório",
    "Subtema": "Processadores e Editores de Texto",
    "Dificuldade": "Fácil",
    "Gabarito": "E",
    "Alt. Correta": "Aplicação de estilos hierárquicos de título ao texto do manual",
    "Contexto": "Um técnico em desenvolvimento de sistemas está elaborando o manual de usuário de uma aplicação web e utiliza um processador de texto para organizar o conteúdo com títulos, sumário automático e estilos de parágrafo. Ao aplicar um estilo de 'Título 1' em cada seção principal do manual, o processador de texto passa a reconhecer esses elementos para gerar o sumário automaticamente.",
    "Comando": "Qual recurso do processador de texto viabiliza a geração automática do sumário?",
    "A": "Inserção de cabeçalho e rodapé nas páginas",
    "B": "Controle de alterações ativado no documento",
    "C": "Numeração automática de páginas no documento inteiro",
    "D": "Formatação manual de fonte em negrito e tamanho maior",
    "E": "Aplicação de estilos hierárquicos de título ao texto do manual"
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
