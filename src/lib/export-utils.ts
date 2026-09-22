import * as XLSX from "xlsx";
import type { QuestionListItem } from "@/components/admin/question-management-list";

const questionTypeLabels: Record<string, string> = {
  FILE_UPLOAD: "Arquivo",
  LONG_TEXT: "Texto longo",
  MULTIPLE_CHOICE: "Múltipla escolha",
  SHORT_TEXT: "Texto curto"
};

const difficultyLabels: Record<string, string> = {
  EASY: "Fácil",
  HARD: "Difícil",
  MEDIUM: "Média"
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
  DRAFT: "Rascunho"
};

function formatQuestionsForExport(questions: QuestionListItem[]) {
  return questions.map((q) => {
    // Encontrar alternativas e a resposta correta
    const optionsText = q.options
      .sort((a, b) => a.position - b.position)
      .map((opt) => `${opt.label}) ${opt.content}`)
      .join("\n");

    const correctOption = q.options.find((opt) => opt.isCorrect);

    return {
      Código: q.code,
      Tipo: questionTypeLabels[q.type] || q.type,
      Disciplina: q.disciplineName,
      Assunto: q.subject,
      Tópico: q.topic || "",
      Nível: difficultyLabels[q.difficulty] || q.difficulty,
      Status: statusLabels[q.status] || q.status,
      Contexto: q.context || "",
      Enunciado: q.statement,
      Suporte_Visual_Tipo: q.visualSupportType,
      Suporte_Visual_Caminho_Arquivo: q.supportImagePath || q.supportFilePath || "",
      Suporte_Visual_Codigo: q.supportCode || "",
      Capacidade: q.capacity || "",
      Descricao_Capacidade: q.capacityDescription || "",
      Funcao: q.function || "",
      Subfuncao: q.subfunction || "",
      Objeto_Conhecimento: q.knowledgeObject || "",
      Subtema: q.subtheme || "",
      Alternativas: optionsText,
      Resposta_Correta: correctOption ? `${correctOption.label}) ${correctOption.content}` : ""
    };
  });
}

export function exportQuestionsToExcel(questions: QuestionListItem[], filename = "questoes.xlsx") {
  const data = formatQuestionsForExport(questions);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Questões");
  XLSX.writeFile(workbook, filename);
}

export function exportQuestionsToCSV(questions: QuestionListItem[], filename = "questoes.csv") {
  const data = formatQuestionsForExport(questions);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  // Criar um blob com BOM para Excel no Windows ler UTF-8 corretamente
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
