# Arquitetura do AVA Online

Este documento descreve a arquitetura atual do projeto com base no que está implementado no repositório.

Ele substitui a versão anterior mais conceitual e agora reflete:
- stack real em uso;
- organização atual das rotas;
- modelo de dados atual;
- fluxo público do aluno;
- responsabilidades de monitoramento e relatórios;
- mecanismos de autenticação, exportação e compartilhamento;
- módulo global de sugestões e reporte de problemas.

## 1. Visão geral

O AVA Online é uma aplicação web full stack para:
- cadastrar questões;
- montar provas;
- liberar aplicação para aluno por código público;
- acompanhar a execução em tempo real;
- gerar relatórios consolidados;
- coletar feedback pedagógico;
- registrar sugestões e problemas da interface.

Hoje o sistema trabalha com três contextos principais:
- `Admin`: acesso autenticado e controle completo;
- `Aluno`: acesso público, sem cadastro, via código da prova;
- `Visualização externa`: acesso por link compartilhável de relatório.

## 2. Stack atual

- `Next.js 15` com App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Prisma`
- `MySQL`
- `Zod`
- `Recharts`
- `pdf-lib`
- `xlsx`

## 3. Decisões arquiteturais atuais

### 3.1 Frontend e backend no mesmo projeto

O projeto usa a arquitetura do Next.js App Router com:
- páginas server-side;
- componentes client-side quando necessário;
- rotas de API em `src/app/api`.

Isso permite manter:
- interface;
- validação;
- acesso ao banco;
- autenticação;
- serviços de analytics

no mesmo repositório, com baixo acoplamento externo.

### 3.2 Banco relacional com Prisma

O banco principal é `MySQL`.

O Prisma é usado para:
- schema;
- migrations;
- client tipado;
- seed inicial.

### 3.3 Autenticação administrativa simples e consistente

O projeto não usa NextAuth/Auth.js.

A autenticação administrativa atual funciona com:
- login por e-mail e senha;
- senha com `bcryptjs`;
- JWT assinado no backend;
- cookie HTTP-only `admin_token`;
- proteção de rotas administrativas via `middleware.ts`;
- guards de servidor em `src/server/auth`.

### 3.4 Monitoramento por polling

O monitoramento em tempo real hoje usa polling periódico.

Não existe SSE/WebSocket implementado neste momento.

### 3.5 Compartilhamento de relatórios por link

Em vez de um perfil autenticado próprio para “visualizador”, o projeto implementa:
- geração de link compartilhável por token;
- visualização externa em modo leitura;
- ativação e desativação desse link.

Essa foi a solução mais compatível com a arquitetura atual.

## 4. Estrutura principal do projeto

```txt
src/
  app/
    admin/
      class-groups/
      corrections/
      dashboard/
      disciplines/
      exams/
      issues/
      login/
      monitoring/
      questions/
      reports/
      settings/
    api/
      admin/**
      assets/**
      auth/**
      issue-reports/**
      public/**
    attempt/[attemptId]/
    exam/[slug]/
    submitted/[attemptId]/
    viewer/reports/[token]/
    layout.tsx
    page.tsx
  components/
    admin/
    dashboard/
    exam/
    feedback/
    forms/
    questions/
    ui/
  lib/
  server/
    auth/
    db/
    services/
    validators/
  prisma/
    schema.prisma
    migrations/
    seed.ts
docs/
```

## 5. Módulos e responsabilidades

### 5.1 Área pública

Responsável por:
- entrada do aluno por código da prova;
- validação do código;
- identificação do aluno;
- aplicação da prova;
- timer;
- envio final;
- feedback pedagógico;
- tela final com retorno e orientações.

Pontos principais:
- [src/app/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/page.tsx)
- [src/components/exam/student-identify-form.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/components/exam/student-identify-form.tsx)
- [src/app/attempt/[attemptId]/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/attempt/%5BattemptId%5D/page.tsx)
- [src/components/exam/attempt-runner.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/components/exam/attempt-runner.tsx)
- [src/app/attempt/[attemptId]/feedback/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/attempt/%5BattemptId%5D/feedback/page.tsx)
- [src/app/submitted/[attemptId]/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/submitted/%5BattemptId%5D/page.tsx)

### 5.2 Área administrativa

Responsável por:
- login e logout;
- dashboard inicial;
- gestão de provas;
- gestão de questões;
- cadastro de turmas;
- cadastro de disciplinas;
- monitoramento em tempo real;
- relatórios consolidados;
- gestão de sugestões e problemas.

Pontos principais:
- [src/app/admin/login/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/login/page.tsx)
- [src/app/admin/dashboard/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/dashboard/page.tsx)
- [src/app/admin/exams/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/exams/page.tsx)
- [src/app/admin/questions/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/questions/page.tsx)
- [src/app/admin/monitoring/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/monitoring/page.tsx)
- [src/app/admin/reports/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/reports/page.tsx)
- [src/app/admin/issues/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/issues/page.tsx)

### 5.3 Serviços de backend

Responsáveis por centralizar:
- métricas;
- relatórios;
- monitoramento;
- regras de negócio das tentativas;
- validações de entrada.

Pontos principais:
- [src/server/services/analytics.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/server/services/analytics.ts)
- [src/server/services/monitoring.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/server/services/monitoring.ts)
- [src/server/services/attempts.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/server/services/attempts.ts)
- [src/server/validators/schemas.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/server/validators/schemas.ts)

## 6. Fluxos centrais do sistema

### 6.1 Fluxo do aluno

1. O aluno abre `/`.
2. Informa o código público da prova.
3. O sistema valida o código em `/api/public/exams/lookup`.
4. Se a prova estiver disponível, libera a segunda etapa.
5. O aluno informa nome, turma e disciplina.
6. O sistema cria a tentativa em `/api/public/attempts/start`.
7. O aluno responde as questões na tela da prova.
8. As respostas são persistidas em `/api/public/attempts/answer`.
9. Se o tempo acabar, o sistema pode finalizar via `/api/public/attempts/timeout`.
10. Ao concluir, envia a prova em `/api/public/attempts/submit`.
11. O aluno responde o formulário final de feedback.
12. O sistema mostra a tela final com resultado e orientações.

### 6.2 Fluxo do admin

1. O admin acessa `/admin/login`.
2. O login gera um cookie JWT HTTP-only.
3. O `middleware.ts` protege as rotas `/admin/*`.
4. Após o login, o admin acessa o dashboard.
5. Pode navegar entre provas, questões, turmas, disciplinas, monitoramento, relatórios e sugestões.

### 6.3 Fluxo de prova

1. O admin cria a prova.
2. Define nome, código público, disciplina, duração e status.
3. Associa questões.
4. Publica ou ativa a prova.
5. O aluno entra via código público.
6. A prova pode ser desativada, encerrada, arquivada ou excluída conforme o caso.

## 7. Separação entre monitoramento e relatórios

Essa separação é uma decisão importante na arquitetura atual.

### 7.1 Monitoramento

Responsabilidade:
- acompanhamento operacional em tempo real da aplicação.

Mostra:
- provas em andamento;
- alunos em andamento;
- alunos concluídos;
- tempo médio decorrido;
- atualização automática por polling.

Arquivos principais:
- [src/app/admin/monitoring/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/monitoring/page.tsx)
- [src/app/api/admin/monitoring/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/admin/monitoring/route.ts)
- [src/server/services/monitoring.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/server/services/monitoring.ts)

### 7.2 Relatórios

Responsabilidade:
- análise consolidada e pedagógica da prova.

Mostra:
- resumo geral;
- desempenho por questão;
- ranking de alunos;
- indicadores pedagógicos;
- feedback final da turma;
- exportação PDF;
- compartilhamento externo por link.

Arquivos principais:
- [src/app/admin/reports/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/reports/page.tsx)
- [src/components/admin/exam-analytics-dashboard.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/components/admin/exam-analytics-dashboard.tsx)
- [src/app/api/admin/reports/export/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/admin/reports/export/route.ts)
- [src/app/api/admin/reports/share/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/admin/reports/share/route.ts)

## 8. Modelo de autenticação e autorização

### 8.1 Login

O endpoint de login é:
- [src/app/api/auth/login/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/auth/login/route.ts)

Ele:
- valida e-mail e senha;
- busca o admin no banco;
- compara com `bcryptjs`;
- gera JWT;
- salva o cookie `admin_token`.

### 8.2 Logout

O endpoint de logout é:
- [src/app/api/auth/logout/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/auth/logout/route.ts)

### 8.3 Proteção de rotas

O `middleware.ts` protege todas as rotas de admin, exceto login:
- [middleware.ts](d:/Projetos%20SENAI/AVA-ONLINE/middleware.ts)

No servidor, guards complementares fazem a validação da sessão:
- `requireAdminSession`
- `getOptionalAdminSession`

## 9. Modelo de dados atual

O schema principal está em:
- [prisma/schema.prisma](d:/Projetos%20SENAI/AVA-ONLINE/prisma/schema.prisma)

### 9.1 Entidades principais

- `AdminUser`
- `Discipline`
- `ClassGroup`
- `Tag`
- `Question`
- `QuestionOption`
- `QuestionTag`
- `Exam`
- `ExamSection`
- `ExamQuestion`
- `PublicExamLink`
- `StudentAttempt`
- `StudentProfileSnapshot`
- `Answer`
- `AnswerAttachment`
- `ManualCorrection`
- `FeedbackFormResponse`
- `FeedbackAnswer`
- `ReportShareLink`
- `IssueReport`

### 9.2 Pontos importantes do schema

#### `Question`
Armazena:
- tipo da questão;
- contexto;
- comando;
- suporte visual;
- explicação;
- temas de estudo;
- links de apoio;
- peso padrão.

#### `Exam`
Armazena:
- nome;
- `publicCode` único;
- disciplina;
- turma alvo opcional;
- janela de aplicação;
- duração;
- status;
- configurações de prova.

#### `StudentAttempt`
Armazena:
- status da tentativa;
- notas;
- duração;
- vínculo com prova e link público.

#### `FeedbackFormResponse` e `FeedbackAnswer`
Armazenam:
- feedback final estruturado da prova;
- respostas escalares;
- respostas abertas;
- seleção única e múltipla.

#### `ReportShareLink`
Armazena:
- token de compartilhamento;
- estado ativo/inativo;
- prova relacionada;
- admin criador.

#### `IssueReport`
Armazena:
- tipo do registro;
- título e descrição;
- status;
- rota de origem;
- contexto;
- imagem opcional;
- vínculo opcional com admin, prova e tentativa.

## 10. Tipos e enums atuais

O sistema usa enums centrais no Prisma:

- `QuestionType`
  - `MULTIPLE_CHOICE`
  - `SHORT_TEXT`
  - `LONG_TEXT`
  - `FILE_UPLOAD`

- `Difficulty`
  - `EASY`
  - `MEDIUM`
  - `HARD`

- `VisualSupportType`
  - `NONE`
  - `ASSET`
  - `CODE`

- `ExamStatus`
  - `DRAFT`
  - `PUBLISHED`
  - `CLOSED`
  - `ARCHIVED`

- `AttemptStatus`
  - `STARTED`
  - `IN_PROGRESS`
  - `SUBMITTED`
  - `EXPIRED`
  - `CANCELED`

- `IssueReportType`
  - `SUGGESTION`
  - `BUG`
  - `QUESTION`

- `IssueReportStatus`
  - `NEW`
  - `IN_REVIEW`
  - `RESOLVED`
  - `ARCHIVED`

## 11. Questões e apoio visual

Na arquitetura atual, uma questão pode conter:
- contexto;
- suporte visual por arquivo/imagem;
- suporte visual por código;
- comando da questão;
- alternativas, quando objetiva.

Essa ordem é respeitada:
- no cadastro;
- na edição;
- na renderização para o aluno.

Campos relacionados:
- `visualSupportType`
- `supportCode`
- `supportImagePath`
- `supportFilePath`

Uploads são atendidos por:
- [src/app/api/admin/question-support/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/admin/question-support/route.ts)
- [src/app/api/assets/question-support/[filename]/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/assets/question-support/%5Bfilename%5D/route.ts)

## 12. Exportação e compartilhamento

### 12.1 Exportação PDF

Hoje a exportação implementada é PDF.

Rota:
- [src/app/api/admin/reports/export/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/admin/reports/export/route.ts)

### 12.2 Compartilhamento externo

Hoje o compartilhamento externo é feito por token.

Rotas:
- criação/gestão: [src/app/api/admin/reports/share/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/admin/reports/share/route.ts)
- visualização: [src/app/viewer/reports/[token]/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/viewer/reports/%5Btoken%5D/page.tsx)

## 13. Módulo global de sugestões e reporte de problemas

Esse módulo foi acoplado globalmente ao layout.

Integração:
- [src/app/layout.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/layout.tsx)
- [src/components/feedback/global-issue-widget.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/components/feedback/global-issue-widget.tsx)

Rotas:
- envio/listagem: [src/app/api/issue-reports/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/issue-reports/route.ts)
- atualização: [src/app/api/issue-reports/[id]/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/issue-reports/%5Bid%5D/route.ts)
- asset: [src/app/api/assets/issue-reports/[filename]/route.ts](d:/Projetos%20SENAI/AVA-ONLINE/src/app/api/assets/issue-reports/%5Bfilename%5D/route.ts)

Área administrativa:
- [src/app/admin/issues/page.tsx](d:/Projetos%20SENAI/AVA-ONLINE/src/app/admin/issues/page.tsx)

## 14. Rotas principais

### Públicas
- `/`
- `/exam/[slug]`
- `/attempt/[attemptId]`
- `/attempt/[attemptId]/feedback`
- `/submitted/[attemptId]`
- `/viewer/reports/[token]`

### Admin
- `/admin/login`
- `/admin/dashboard`
- `/admin/exams`
- `/admin/questions`
- `/admin/disciplines`
- `/admin/class-groups`
- `/admin/monitoring`
- `/admin/reports`
- `/admin/issues`

### APIs principais
- `/api/auth/login`
- `/api/auth/logout`
- `/api/public/exams/lookup`
- `/api/public/attempts/start`
- `/api/public/attempts/answer`
- `/api/public/attempts/submit`
- `/api/public/attempts/timeout`
- `/api/admin/exams`
- `/api/admin/exams/[id]`
- `/api/admin/exams/[id]/lifecycle`
- `/api/admin/questions`
- `/api/admin/questions/import`
- `/api/admin/reports/export`
- `/api/admin/reports/share`
- `/api/admin/monitoring`
- `/api/issue-reports`

## 15. Estado visual e identidade

O projeto foi refinado para uma identidade baseada em:
- vermelho;
- preto;
- branco.

Essa direção foi aplicada em:
- tela pública;
- login admin;
- dashboard;
- formulários;
- relatórios;
- monitoramento;
- cards;
- estados selecionados na prova;
- feedback visual de sucesso e erro.

## 16. Limites e próximos passos naturais

A arquitetura atual está funcional, mas há alguns pontos que podem evoluir em fases futuras:
- autenticação própria para perfil visualizador, se isso for necessário;
- exportações adicionais além do PDF;
- expansão do fluxo de correção manual;
- upload real de resposta do aluno para questões `FILE_UPLOAD`, se o produto exigir esse fechamento completo;
- testes automatizados mais amplos.

## 17. Documentos relacionados

Para complementar esta visão arquitetural:
- setup local: [docs/GUIA_INSTALACAO_LOCAL.md](docs/GUIA_INSTALACAO_LOCAL.md)
- apresentação funcional: [docs/APRESENTACAO_DO_SISTEMA.md](docs/APRESENTACAO_DO_SISTEMA.md)
- visão geral rápida: [README.md](README.md)
