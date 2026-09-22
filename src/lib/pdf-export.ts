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

export function exportQuestionsToPDF(questions: QuestionListItem[]) {
  // Criar um iframe oculto para impressão
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    alert("Erro ao gerar PDF.");
    return;
  }

  // Gerar o HTML para as questões
  let questionsHtml = "";

  questions.forEach((q, index) => {
    // Alternativas
    let optionsHtml = "";
    if (q.options.length > 0) {
      optionsHtml = `<div class="options">`;
      const sortedOptions = [...q.options].sort((a, b) => a.position - b.position);
      sortedOptions.forEach((opt) => {
        const isCorrectClass = opt.isCorrect ? "correct-option" : "";
        const correctLabel = opt.isCorrect ? `<span class="correct-badge">Correta</span>` : "";
        optionsHtml += `
          <div class="option ${isCorrectClass}">
            <div class="option-content"><strong>${opt.label})</strong> ${opt.content}</div>
            ${correctLabel}
          </div>
        `;
      });
      optionsHtml += `</div>`;
    } else {
      optionsHtml = `<p class="no-options">Nenhuma alternativa cadastrada.</p>`;
    }

    // Suporte Visual (simplificado)
    let visualSupportHtml = "";
    if (q.visualSupportType === "CODE" && q.supportCode) {
      visualSupportHtml = `
        <div class="visual-support">
          <p class="support-label">Código de Suporte:</p>
          <pre><code>${q.supportCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
        </div>
      `;
    } else if (q.visualSupportType === "ASSET" && q.supportImagePath) {
      visualSupportHtml = `
        <div class="visual-support">
          <p class="support-label">Imagem de Suporte:</p>
          <img src="${q.supportImagePath}" alt="Suporte Visual" style="max-width: 100%; max-height: 300px; object-fit: contain; margin-top: 8px;" />
        </div>
      `;
    }

    questionsHtml += `
      <div class="question-container">
        <div class="question-header">
          <span class="q-number">Questão ${index + 1}</span>
          <span class="q-code">${q.code}</span>
          <span class="q-meta">${q.disciplineName} · ${questionTypeLabels[q.type] || q.type} · ${difficultyLabels[q.difficulty] || q.difficulty}</span>
        </div>
        
        ${
          q.capacity || q.function || q.knowledgeObject || q.subtheme
            ? `<div class="saep-section">
                <strong>Matriz de Referência (SAEP):</strong>
                <ul class="saep-list">
                  ${q.capacity ? `<li><strong>Capacidade:</strong> ${q.capacity}</li>` : ""}
                  ${q.capacityDescription ? `<li><strong>Descrição:</strong> ${q.capacityDescription}</li>` : ""}
                  ${q.function ? `<li><strong>Função:</strong> ${q.function}</li>` : ""}
                  ${q.subfunction ? `<li><strong>Subfunção:</strong> ${q.subfunction}</li>` : ""}
                  ${q.knowledgeObject ? `<li><strong>Objeto de Conhecimento:</strong> ${q.knowledgeObject}</li>` : ""}
                  ${q.subtheme ? `<li><strong>Subtema:</strong> ${q.subtheme}</li>` : ""}
                </ul>
               </div>`
            : ""
        }

        ${q.context ? `<div class="context"><strong>Contexto:</strong><br/>${q.context.replace(/\n/g, "<br/>")}</div>` : ""}
        
        ${visualSupportHtml}

        <div class="statement">
          <strong>Enunciado:</strong><br/>
          ${q.statement.replace(/\n/g, "<br/>")}
        </div>
        
        <div class="options-section">
          <strong>Alternativas:</strong>
          ${optionsHtml}
        </div>
      </div>
    `;
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Exportação de Questões</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #1f2937;
          line-height: 1.5;
          padding: 20px;
        }
        h1 {
          text-align: center;
          color: #111827;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .question-container {
          margin-bottom: 40px;
          page-break-inside: avoid;
          border: 1px solid #e5e7eb;
          padding: 20px;
          border-radius: 8px;
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .q-number { font-weight: bold; font-size: 1.2em; color: #111827; }
        .q-code { font-family: monospace; color: #b91c1c; font-weight: bold; background: #fef2f2; padding: 2px 6px; border-radius: 4px; }
        .q-meta { color: #6b7280; font-size: 0.9em; }
        .saep-section {
          background-color: #f9fafb;
          border: 1px dashed #d1d5db;
          padding: 10px 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 0.9em;
        }
        .saep-list { margin: 5px 0 0 0; padding-left: 20px; color: #4b5563; }
        .context, .statement {
          margin-bottom: 15px;
          background: #f9fafb;
          padding: 10px;
          border-radius: 6px;
        }
        .visual-support {
          margin-bottom: 15px;
          padding: 10px;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
        }
        .support-label { font-weight: bold; margin-bottom: 5px; font-size: 0.9em; color: #475569; }
        pre { background: #1e293b; color: #f8fafc; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 0.9em; }
        .options-section { margin-top: 15px; }
        .options { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .option { 
          display: flex; 
          justify-content: space-between; 
          padding: 10px; 
          border: 1px solid #e5e7eb; 
          border-radius: 6px; 
        }
        .correct-option { border-color: #22c55e; background-color: #f0fdf4; }
        .correct-badge { background: #22c55e; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
        .no-options { color: #6b7280; font-style: italic; }
        
        @media print {
          body { padding: 0; }
          .question-container { border: none; padding: 0; margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; border-radius: 0; padding-bottom: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>Banco de Questões - Exportação</h1>
      ${questionsHtml}
    </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Esperar as imagens carregarem antes de imprimir
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Remover o iframe após a impressão/cancelamento
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 1000); // tempo para garantir que estilos e imagens sejam renderizados
}
