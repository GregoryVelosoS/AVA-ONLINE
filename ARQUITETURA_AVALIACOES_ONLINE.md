# Arquitetura do AVA Online

Este documento descreve a arquitetura atual do projeto com base no que esta implementado no repositorio.

## 1. Visao geral

O AVA Online e uma aplicacao web full stack para:
- cadastrar questoes;
- montar provas;
- liberar acesso do aluno por codigo publico;
- acompanhar aplicacao em tempo real;
- gerar relatorios consolidados;
- coletar feedback pedagogico;
- registrar sugestoes e problemas;
- controlar usuarios internos com perfis diferentes.

## 2. Stack atual

- Next.js 15 com App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- MySQL
- Zod
- Recharts
- pdf-lib
- html2canvas
- jspdf
- xlsx
- @vercel/blob

## 3. Decisoes arquiteturais

### 3.1 Projeto full stack unico

O projeto usa:
- paginas server-side;
- componentes client-side quando necessario;
- APIs em `src/app/api`;
- servicos internos em `src/server/services`.

### 3.2 Persistencia

Banco principal:
- MySQL

Camada ORM:
- Prisma

Versionamento:
- migrations
- seed

### 3.3 Autenticacao

A autenticacao interna atual usa:
- `AdminUser`
- email e senha
- hash com `bcryptjs`
- JWT em cookie HTTP-only
- protecao por middleware e guards

### 3.4 Perfis internos

Perfis suportados:
- `ADM`
- `VISUALIZADOR`

Regras:
- `ADM` tem acesso total
- `VISUALIZADOR` acessa apenas relatorios

### 3.5 Monitoramento

O monitoramento em tempo real usa polling.

Nao ha SSE ou WebSocket implementado neste momento.

### 3.6 Uploads

O projeto trabalha em dois modos:

#### Local
- usa `UPLOAD_DIR`

#### Producao no Vercel
- usa `Vercel Blob`
- ativado por `BLOB_READ_WRITE_TOKEN`

Essa estrategia evita quebrar o ambiente local e permite storage persistente online.

## 4. Estrutura principal

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
      users/
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
    uploads.ts
  prisma/
    schema.prisma
    migrations/
    seed.ts
docs/
```

## 5. Modulos principais

### 5.1 Area publica

Responsavel por:
- validacao de codigo da prova
- identificacao do aluno
- aplicacao da prova
- timer
- envio
- feedback final

Arquivos centrais:
- `src/app/page.tsx`
- `src/components/exam/student-identify-form.tsx`
- `src/app/attempt/[attemptId]/page.tsx`
- `src/components/exam/attempt-runner.tsx`

### 5.2 Area administrativa

Responsavel por:
- login interno
- dashboard
- provas
- questoes
- turmas
- disciplinas
- monitoramento
- relatorios
- sugestoes
- usuarios

### 5.3 Servicos

Servicos centrais:
- `src/server/services/analytics.ts`
- `src/server/services/attempt-result.ts`
- `src/server/services/monitoring.ts`
- `src/server/services/attempts.ts`

### 5.4 Uploads

Responsavel por abstrair o storage:
- `src/server/uploads.ts`

Funcoes principais:
- salvar apoio visual de questoes
- salvar imagem de issue report
- remover assets gerenciados
- decidir entre pasta local e Vercel Blob

## 6. Fluxos principais

### 6.1 Fluxo do aluno

1. aluno abre `/`
2. informa codigo da prova
3. sistema valida codigo
4. aluno informa nome, turma e disciplina
5. sistema cria tentativa
6. aluno responde
7. sistema salva respostas
8. aluno envia a prova
9. aluno responde formulario final
10. sistema mostra fechamento da prova
11. aluno pode exportar o resultado individual em PDF

### 6.2 Fluxo do ADM

1. login em `/admin/login`
2. middleware valida cookie
3. guards validam perfil
4. ADM acessa todas as areas internas

### 6.3 Fluxo do VISUALIZADOR

1. login em `/admin/login`
2. token carrega `role=VISUALIZADOR`
3. menu mostra apenas relatorios
4. tentativas de abrir outras areas admin sao bloqueadas

## 7. Separacao entre monitoramento e relatorios

### Monitoramento

Responsabilidade:
- acompanhamento operacional da aplicacao

Mostra:
- provas em andamento
- alunos em andamento
- concluidos
- tempo medio decorrido

### Relatorios

Responsabilidade:
- analise consolidada e pedagogica

Mostra:
- resumo da prova
- desempenho por aluno
- desempenho por questao
- ranking
- feedback da turma
- exportacao PDF visual do container analitico atual
- link compartilhavel

## 8. Modelo de autenticacao e autorizacao

### Token

O token carrega:
- `sub`
- `name`
- `email`
- `role`

### Middleware

O `middleware.ts`:
- protege `/admin/*`
- protege `/api/admin/*`
- redireciona `VISUALIZADOR` para `/admin/reports`

### Guards

Guards atuais:
- `requireAdminSession`
- `requireReportsSession`
- `requireSessionByRole`
- `getOptionalAdminSession`

## 9. Modelo de dados atual

Schema principal:
- `prisma/schema.prisma`

### Entidades principais

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

### Ponto novo importante

`AdminUser` agora possui:
- `role`
- `isActive`

Perfis suportados:
- `ADM`
- `VISUALIZADOR`

## 10. Uploads e assets

### Apoio visual de questoes

Endpoint:
- `src/app/api/admin/question-support/route.ts`

Uso:
- upload de imagem
- upload de arquivo complementar

### Imagens de sugestoes e reportes

Endpoint:
- `src/app/api/issue-reports/route.ts`

### Resolucao de URL

Helpers:
- `src/lib/assets.ts`

Eles retornam:
- URL externa direta quando o asset ja esta no Blob
- rota interna quando o asset esta salvo localmente

## 11. Rotas principais

### Publicas
- `/`
- `/exam/[slug]`
- `/attempt/[attemptId]`
- `/attempt/[attemptId]/feedback`
- `/submitted/[attemptId]`
- `/api/public/attempts/[attemptId]/export/pdf`
- `/viewer/reports/[token]`

### Internas
- `/admin/login`
- `/admin/dashboard`
- `/admin/exams`
- `/admin/questions`
- `/admin/disciplines`
- `/admin/class-groups`
- `/admin/monitoring`
- `/admin/reports`
- `/admin/issues`
- `/admin/users`

## 12. Exportacoes implementadas

### Resultado individual do aluno

O fechamento da prova em `/submitted/[attemptId]` agora permite exportar em PDF:
- dados gerais da tentativa
- score e percentual
- resultado por questao
- resposta do aluno
- resposta correta, quando aplicavel
- feedback esperado
- explicacao da resposta
- temas e materiais para revisao
- resumo final consolidado

Implementacao principal:
- `src/server/services/attempt-result.ts`
- `src/app/api/public/attempts/[attemptId]/export/pdf/route.ts`

### Relatorios consolidados

O PDF dos relatorios nao depende mais de `window.print()` nem de uma composicao simplificada no backend.

Agora a exportacao:
- captura a area util do relatorio visivel em tela
- preserva cards, graficos, tabelas e blocos analiticos
- pagina automaticamente o conteudo longo
- gera um PDF fiel ao estado atual dos filtros aplicados

Implementacao principal:
- `src/app/admin/reports/page.tsx`
- `src/components/admin/report-actions-panel.tsx`

## 13. Ambientes

### Desenvolvimento local

Recomendado:
- MySQL local
- `UPLOAD_DIR`
- sem `BLOB_READ_WRITE_TOKEN`

### Producao

Recomendado:
- Vercel
- Railway MySQL
- Vercel Blob

Variaveis centrais:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `BLOB_READ_WRITE_TOKEN`

## 14. Documentos relacionados

- [README.md](README.md)
- [docs/GUIA_INSTALACAO_LOCAL.md](docs/GUIA_INSTALACAO_LOCAL.md)
- [docs/DEPLOY_VERCEL_RAILWAY_BLOB.md](docs/DEPLOY_VERCEL_RAILWAY_BLOB.md)
- [docs/APRESENTACAO_DO_SISTEMA.md](docs/APRESENTACAO_DO_SISTEMA.md)
