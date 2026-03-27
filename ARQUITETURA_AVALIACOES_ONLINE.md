# Sistema de Avaliações Online — Especificação e Arquitetura

## ETAPA 1 — Especificação técnica consolidada

### 1.1 Resumo do sistema
Plataforma web full stack para criação, aplicação e análise de avaliações online, com dois contextos de uso:
- **Área administrativa (privada)** para professor/administrador único (Admin);
- **Área pública (link da prova)** para alunos sem necessidade de conta.

A solução cobre o ciclo completo da avaliação:
1. cadastro e organização de questões;
2. montagem/publicação de prova com link;
3. coleta de respostas e confiança por questão;
4. correção automática + manual;
5. dashboards com métricas pedagógicas e monitoramento em tempo real;
6. relatórios e exportação (CSV/XLSX).

### 1.2 Objetivos do produto
- Permitir criação rápida de provas reutilizando banco de questões.
- Oferecer acesso simplificado para aluno por link público.
- Coletar dados ricos de aprendizagem (resposta, tempo, confiança e feedback final).
- Suportar tomada de decisão pedagógica com indicadores diagnósticos.
- Garantir segurança e governança dos dados com base em boas práticas (LGPD básica).

### 1.3 Perfis e permissões

#### Admin
- Login obrigatório.
- Acesso total a CRUD de questões, provas e links.
- Acesso a monitoramento, correção manual, relatórios e exportações.
- Gestão de configurações do sistema.

#### Aluno (anônimo guiado por link)
- Sem autenticação por conta.
- Antes de iniciar: informar nome, turma e disciplina.
- Pode responder somente prova ativa/publicada e dentro da janela válida.
- Não possui acesso a áreas internas.

### 1.4 Funcionalidades principais

#### Módulo de autenticação e autorização
- Login seguro do Admin (sessão + hash de senha).
- Proteção de rotas e APIs administrativas.
- Middlewares de autorização por papel.

#### Módulo de banco de questões
- Criar/editar/excluir/arquivar/duplicar.
- Tipos: múltipla escolha, texto curto, texto longo, arquivo.
- Metadados completos: código, disciplina, matéria, assunto, tags, nível, contexto, enunciado, explicação, peso, status.
- Filtros avançados por código/tipo/metadados/texto.
- Reuso em múltiplas provas.

#### Módulo de provas
- CRUD de prova com status (rascunho/publicada/encerrada/arquivada).
- Composição por seções e ordem.
- Pré-visualização antes da publicação.
- Configurações: janela de aplicação, limite de tempo, tentativas, randomização, nota imediata.
- Geração de link público exclusivo com ativação/expiração.

#### Módulo de aplicação pública ao aluno
- Tela de validação do link e disponibilidade.
- Formulário obrigatório de identificação (nome, turma, disciplina).
- Execução com autosave periódico.
- Registro de início, progresso e envio final.
- Bloqueio de envio fora da janela/estado válido.
- Tela de confirmação pós-envio.

#### Módulo de respostas e correção
- Correção automática para múltipla escolha.
- Correção híbrida/configurável para texto curto.
- Correção manual para texto longo e arquivo.
- Registro de confiança por questão (1,2,3).
- Reprocessamento da nota final após correção manual.

#### Questionário final pedagógico
- Itens Likert (1–5), flag sim/não e comentário opcional.
- Armazenamento por tentativa.
- Agregações por prova/turma/aluno.

#### Dashboard e análises
- Métricas gerais, por prova, por turma, por aluno e por questão.
- Indicadores diagnósticos automáticos (erro + confiança alta, acerto + confiança baixa etc.).
- Monitoramento em tempo real de andamento de tentativas.

#### Relatórios e exportação
- Exportação CSV e XLSX com filtros (prova/turma/período/aluno).
- Relatório detalhado de correção manual pendente/concluída.

### 1.5 Regras de negócio consolidadas (RN01–RN17)
- RN01: somente Admin opera área interna.
- RN02: aluno acessa exclusivamente por link público.
- RN03: identificação obrigatória antes de iniciar.
- RN04: tentativa registra início/envio.
- RN05: resposta compatível com tipo de questão.
- RN06: múltipla escolha exige gabarito.
- RN07: texto/arquivo podem depender de correção manual.
- RN08: confiança por resposta é obrigatória.
- RN09: feedback final vinculado à tentativa.
- RN10: consultas por aluno/prova/turma/disciplina/questão.
- RN11: questões reutilizáveis.
- RN12: link com estados ativo/inativo/expirado/encerrado.
- RN13: múltiplas provas simultâneas.
- RN14: histórico completo de tentativas/correções.
- RN15: exportação CSV/XLSX.
- RN16: consistência entre nota automática e final.
- RN17: destaque automático de alertas pedagógicos.

### 1.6 Requisitos não funcionais (NFR)
- UI responsiva e legível (desktop/mobile).
- UX clara para Admin e aluno.
- Segurança: autenticação robusta, proteção de rotas, validação FE/BE.
- Upload seguro (extensão/MIME/tamanho, nome aleatório, armazenamento protegido).
- Persistência transacional confiável em banco relacional.
- Observabilidade básica (logs de erro e auditoria mínima de eventos críticos).
- Arquitetura modular e escalável.
- Sanitização de entradas e minimização de dados (LGPD básica).

---

## ETAPA 2 — Arquitetura recomendada

### 2.1 Stack escolhida
- **Framework:** Next.js 15 (App Router) + TypeScript.
- **UI:** Tailwind CSS + componente base (shadcn/ui) + ícones Lucide.
- **Backend:** Route Handlers do Next.js + camada de serviços de domínio.
- **Banco:** PostgreSQL 16.
- **ORM:** Prisma.
- **Auth Admin:** Auth.js (NextAuth) com Credentials Provider + sessão JWT/DB.
- **Validação:** Zod (DTOs compartilhados FE/BE).
- **Gráficos:** Recharts.
- **Tempo real:** Server-Sent Events (SSE) para monitoramento + fallback polling.
- **Upload:** armazenamento local em dev (`/uploads`) + adaptador S3/R2 em produção.
- **Filas (futuro):** BullMQ/Redis para jobs de recomputação pesada.

### 2.2 Justificativa técnica
- Next.js unifica front/back e reduz custo de integração.
- Prisma acelera modelagem relacional e migrações versionadas.
- PostgreSQL oferece robustez analítica e integridade.
- SSE é simples para painéis de acompanhamento com baixo overhead.
- Arquitetura por camadas evita acoplamento com framework e facilita crescimento.

### 2.3 Organização de pastas sugerida

```txt
src/
  app/
    (public)/
      exam/[slug]/
      attempt/[attemptId]/
      submitted/[attemptId]/
    (admin)/
      admin/login
      admin/dashboard
      admin/exams
      admin/questions
      admin/monitoring
      admin/corrections
      admin/reports
      admin/settings
    api/
      admin/**
      public/**
      realtime/**
  components/
    ui/
    forms/
    charts/
    exam/
    dashboard/
  modules/
    auth/
    questions/
    exams/
    attempts/
    corrections/
    analytics/
    reports/
    uploads/
  server/
    db/
    repositories/
    services/
    policies/
    validators/
    mappers/
  lib/
    constants/
    utils/
    logger/
prisma/
  schema.prisma
  migrations/
  seed.ts
public/
uploads/ (dev)
```

### 2.4 Módulos de domínio
- **auth**: login, sessão, middleware de proteção.
- **questions**: CRUD, versionamento leve, filtros.
- **exams**: composição, seções, publicação, link público.
- **attempts**: ciclo de vida da tentativa, autosave, submissão.
- **corrections**: fila de pendências manuais, nota e comentário.
- **analytics**: agregações e indicadores diagnósticos.
- **reports**: exportação CSV/XLSX.
- **uploads**: validação e persistência de anexos.

### 2.5 Estratégia de autenticação
- Apenas Admin autenticado.
- Senha com `bcrypt` (cost >= 12).
- Sessão expirada por inatividade + CSRF em rotas sensíveis.
- Rate limit por IP no endpoint de login.
- Auditoria: log de login, publicação/encerramento de prova, exportações.

### 2.6 Estratégia de persistência
- PostgreSQL com constraints fortes.
- Migrations Prisma para versionamento.
- Transações para submissão/correção/reprocessamento de nota.
- Índices para consultas críticas (slug, status, examId, startedAt, tags).

### 2.7 Estratégia de upload
- Tipos permitidos configuráveis (PDF, DOCX, PNG, JPG, ZIP opcional).
- Limite por arquivo (ex.: 10MB) e antivírus opcional em produção.
- Nome físico não previsível (UUID), armazenamento fora de pasta pública quando sensível.
- URL assinada temporária para download administrativo.

### 2.8 Estratégia de atualização em tempo real
- Canal SSE por prova ativa (`/api/realtime/exams/:id`).
- Eventos: `attempt_started`, `attempt_autosaved`, `attempt_submitted`, `metrics_updated`.
- Fallback polling a cada 10–20s quando SSE indisponível.

---

## ETAPA 3 — Modelagem de dados

### 3.1 Diagrama textual (visão macro)
- `AdminUser` 1:N `AuditLog`
- `Discipline` 1:N `Subject` 1:N `Topic`
- `Question` N:N `Tag` (via `QuestionTag`)
- `Question` 1:N `QuestionOption`
- `Exam` 1:N `ExamSection`
- `Exam` N:N `Question` (via `ExamQuestion`)
- `Exam` 1:N `PublicExamLink`
- `Exam` 1:N `StudentAttempt`
- `StudentAttempt` 1:1 `StudentProfileSnapshot`
- `StudentAttempt` 1:N `Answer`
- `Answer` 0:N `AnswerAttachment`
- `Answer` 0:1 `ManualCorrection`
- `StudentAttempt` 0:1 `FeedbackFormResponse`

### 3.2 Tabelas principais (resumo técnico)

#### `admin_users`
- `id` (PK, uuid)
- `name` (varchar 120)
- `email` (varchar 160, unique)
- `password_hash` (varchar)
- `is_active` (bool)
- `last_login_at` (timestamp null)
- `created_at`, `updated_at`

#### `disciplines`
- `id` (PK)
- `name` (unique)
- `code` (unique)
- `created_at`, `updated_at`

#### `class_groups`
- `id` (PK)
- `name`
- `code` (unique)
- `discipline_id` (FK -> disciplines.id, null)
- `created_at`, `updated_at`

#### `tags`
- `id` (PK)
- `label` (unique)
- `color` (varchar 16, null)
- `created_at`

#### `questions`
- `id` (PK, uuid)
- `code` (unique)
- `type` enum(`MULTIPLE_CHOICE`,`SHORT_TEXT`,`LONG_TEXT`,`FILE_UPLOAD`)
- `title` (varchar 180, null)
- `discipline_id` (FK)
- `subject` (varchar 120)
- `topic` (varchar 120, null)
- `difficulty` enum(`EASY`,`MEDIUM`,`HARD`)
- `context` (text, null)
- `statement` (text)
- `expected_feedback` (text, null)
- `answer_explanation` (text, null)
- `default_weight` (numeric(6,2), default 1)
- `status` enum(`DRAFT`,`ACTIVE`,`ARCHIVED`)
- `created_by` (FK -> admin_users.id)
- `created_at`, `updated_at`, `archived_at`

#### `question_tags`
- `question_id` (FK)
- `tag_id` (FK)
- PK composta (`question_id`,`tag_id`)

#### `question_options`
- `id` (PK, uuid)
- `question_id` (FK)
- `label` (varchar 5)
- `content` (text)
- `is_correct` (bool)
- `position` (int)

#### `exams`
- `id` (PK, uuid)
- `title`, `description`
- `discipline_id` (FK)
- `target_class_group_id` (FK null)
- `instructions` (text)
- `start_at`, `end_at` (timestamp)
- `time_limit_minutes` (int null)
- `status` enum(`DRAFT`,`PUBLISHED`,`CLOSED`,`ARCHIVED`)
- `show_score_after_submit` (bool)
- `max_attempts` (int default 1)
- `randomize_questions` (bool)
- `randomize_options` (bool)
- `created_by` (FK)
- `created_at`, `updated_at`

#### `exam_sections`
- `id` (PK)
- `exam_id` (FK)
- `title`
- `description` (null)
- `position` (int)

#### `exam_questions`
- `id` (PK)
- `exam_id` (FK)
- `section_id` (FK null)
- `question_id` (FK)
- `position` (int)
- `custom_weight` (numeric(6,2), null)
- `is_required` (bool)
- unique (`exam_id`,`question_id`,`section_id`,`position`)

#### `public_exam_links`
- `id` (PK)
- `exam_id` (FK)
- `slug` (varchar 80, unique)
- `is_active` (bool)
- `valid_from`, `valid_until` (timestamp null)
- `max_uses` (int null)
- `used_count` (int default 0)
- `closed_at` (timestamp null)
- `created_at`

#### `student_attempts`
- `id` (PK, uuid)
- `exam_id` (FK)
- `public_link_id` (FK)
- `attempt_number` (int)
- `status` enum(`STARTED`,`IN_PROGRESS`,`SUBMITTED`,`EXPIRED`,`CANCELED`)
- `started_at` (timestamp)
- `submitted_at` (timestamp null)
- `auto_score` (numeric 8,2 default 0)
- `manual_score` (numeric 8,2 default 0)
- `final_score` (numeric 8,2 default 0)
- `duration_seconds` (int null)
- `created_at`, `updated_at`

#### `student_profile_snapshots`
- `id` (PK)
- `attempt_id` (FK unique)
- `student_name` (varchar 160)
- `class_group_name` (varchar 120)
- `discipline_informed` (varchar 120)

#### `answers`
- `id` (PK, uuid)
- `attempt_id` (FK)
- `question_id` (FK)
- `selected_option_id` (FK null)
- `short_text_answer` (varchar 2000, null)
- `long_text_answer` (text, null)
- `is_correct` (bool null)
- `auto_score` (numeric 8,2 default 0)
- `manual_score` (numeric 8,2 default 0)
- `final_score` (numeric 8,2 default 0)
- `confidence_level` enum(`1`,`2`,`3`)
- `answered_at` (timestamp)
- unique (`attempt_id`,`question_id`)

#### `answer_attachments`
- `id` (PK)
- `answer_id` (FK)
- `storage_provider` (varchar 20)
- `file_path` (text)
- `original_name` (varchar 255)
- `mime_type` (varchar 120)
- `size_bytes` (bigint)
- `created_at`

#### `manual_corrections`
- `id` (PK)
- `answer_id` (FK unique)
- `reviewer_id` (FK -> admin_users.id)
- `score` (numeric 8,2)
- `comment` (text null)
- `status` enum(`PENDING`,`REVIEWED`,`RETURNED`)
- `reviewed_at` (timestamp null)

#### `feedback_form_responses`
- `id` (PK)
- `attempt_id` (FK unique)
- `clarity_score` int check 1..5
- `difficulty_score` int check 1..5
- `time_adequacy_score` int check 1..5
- `content_alignment_score` int check 1..5
- `self_assessment_score` int check 1..5
- `confusing_question_flag` bool
- `open_comment` text null
- `created_at`

#### `audit_logs`
- `id` (PK)
- `admin_user_id` (FK)
- `action` (varchar 120)
- `resource_type` (varchar 80)
- `resource_id` (varchar 80)
- `metadata_json` (jsonb)
- `created_at`

### 3.3 Índices recomendados
- `questions(code, type, difficulty, status)`
- `question_tags(tag_id, question_id)`
- `exam_questions(exam_id, position)`
- `public_exam_links(slug, is_active, valid_until)`
- `student_attempts(exam_id, status, started_at, submitted_at)`
- `answers(attempt_id, question_id, confidence_level, is_correct)`
- `manual_corrections(status, reviewed_at)`

### 3.4 Regras de integridade importantes
- Prova publicada deve ter ao menos 1 questão.
- Questão múltipla escolha deve possuir >=2 opções e >=1 correta.
- `submitted_at` obrigatório quando status = `SUBMITTED`.
- Nota final da tentativa = auto + manual (com recalculadora transacional).

---

## ETAPA 4 — Fluxos completos do sistema

### 4.1 Fluxo do Admin
1. Admin acessa `/admin/login`.
2. Sistema autentica credenciais.
3. Admin entra no dashboard.
4. Pode gerenciar questões, provas, monitoramento, correções e relatórios.
5. Ações críticas são auditadas.

### 4.2 Fluxo do Aluno
1. Aluno recebe link público da prova.
2. Sistema valida link/estado/janela temporal.
3. Aluno preenche identificação (nome/turma/disciplina).
4. Sistema cria tentativa com `STARTED` e registra `startedAt`.
5. Aluno responde questões + confiança por questão.
6. Autosave periódica (opcional configurável).
7. Ao finalizar, preenche feedback final.
8. Envia tentativa; sistema calcula notas automáticas e marca `SUBMITTED`.
9. Exibe confirmação final.

### 4.3 Fluxo de criação de prova
1. Admin cria prova em rascunho.
2. Define metadados e configurações (tempo, tentativas etc.).
3. Seleciona questões do banco e organiza por seção/ordem.
4. Pré-visualiza prova.
5. Publica prova.
6. Sistema gera/ativa link público e passa a aceitar tentativas.

### 4.4 Fluxo de resolução e autosave
1. Cada alteração de resposta dispara debounce (ex.: 2–5s).
2. API salva resposta parcial por `attemptId + questionId`.
3. Atualiza `answeredAt` e confiança.
4. Tempo limite monitorado no cliente + conferência no servidor.
5. Em timeout, servidor encerra tentativa conforme regra (envio automático ou expiração).

### 4.5 Fluxo de correção manual
1. Após submissão, respostas discursivas/arquivo entram em fila `PENDING`.
2. Admin abre central de correção por prova/turma/aluno.
3. Atribui nota, comentário e status.
4. Sistema recalcula `manual_score` e `final_score` da resposta/tentativa.
5. Dashboard e relatórios são atualizados.

### 4.6 Fluxo de análise no dashboard
1. Serviço de analytics agrega dados por janela temporal/prova/turma.
2. Métricas são expostas via endpoints.
3. Dashboard renderiza KPIs e gráficos.
4. Motor de diagnósticos aplica regras:
   - erro + confiança 3;
   - acerto + confiança 1;
   - outliers negativos vs média da turma;
   - fragilidade por tag/matéria/nível.
5. Admin pode navegar geral -> prova -> turma -> aluno -> questão.

---

## ETAPA 5 — Telas (páginas, componentes e validações)

### 5.1 Área pública do aluno

#### 1) Página de acesso por link (`/exam/[slug]`)
- Componentes: cartão de status da prova, bloco de disponibilidade, CTA iniciar.
- Validações: link ativo, janela válida, status da prova, limite de uso.

#### 2) Formulário de identificação (`/exam/[slug]/identify`)
- Componentes: inputs nome/turma/disciplina.
- Validações: obrigatoriedade, tamanho mínimo/máximo, sanitização.

#### 3) Tela de instruções (`/attempt/[id]/instructions`)
- Componentes: regras, tempo limite, quantidade de questões, botão começar.
- Validações: tentativa ainda não submetida/expirada.

#### 4) Tela de resolução (`/attempt/[id]`)
- Componentes: cabeçalho com cronômetro, navegação entre questões, renderizador por tipo, controle de confiança (1/2/3), autosave indicator.
- Validações: tipo de resposta compatível, confiança obrigatória antes de avançar/finalizar.

#### 5) Tela de feedback final (`/attempt/[id]/feedback`)
- Componentes: perguntas 1–5, sim/não, comentário opcional.
- Validações: campos obrigatórios quantitativos.

#### 6) Tela de confirmação (`/submitted/[id]`)
- Componentes: protocolo, horário de envio, mensagem final.

### 5.2 Área administrativa

1. Login Admin (`/admin/login`)
2. Dashboard inicial (`/admin/dashboard`)
3. Lista de provas (`/admin/exams`)
4. Criar/editar prova (`/admin/exams/new`, `/admin/exams/[id]/edit`)
5. Prévia da prova (`/admin/exams/[id]/preview`)
6. Banco de questões (`/admin/questions`)
7. Criar/editar questão (`/admin/questions/new`, `/admin/questions/[id]/edit`)
8. Monitoramento em tempo real (`/admin/monitoring/[examId]`)
9. Correção manual (`/admin/corrections`)
10. Resultados por prova (`/admin/results/exams/[id]`)
11. Resultados por aluno (`/admin/results/students`)
12. Relatórios/exportação (`/admin/reports`)
13. Configurações (`/admin/settings`)

### 5.3 Componentes reutilizáveis-chave
- `QuestionRenderer` (4 tipos de questão)
- `ConfidenceSelector`
- `AutosaveStatus`
- `ExamStatusBadge`
- `MetricCard`
- `DistributionChart`
- `HeatmapByTag`
- `CorrectionPanel`
- `ExportDialog`

### 5.4 Estados de UX obrigatórios
- Carregando (skeleton/spinner).
- Vazio (sem dados).
- Erro recuperável (retry).
- Sucesso (toast/alert).

---

## ETAPA 6 — Plano de implementação (backlog por fases)

### Fase 0 — Fundação do projeto
- Setup Next.js + TS + Tailwind + Prisma + Postgres.
- Configuração de lint, format, testes básicos.
- `.env.example`, scripts de migração/seed, README base.

### Fase 1 — Segurança e autenticação Admin
- Modelo `AdminUser` + seed admin inicial.
- Auth.js com login credentials.
- Middleware de proteção de rotas admin.
- Auditoria mínima de ações críticas.

### Fase 2 — Banco de questões
- CRUD completo de questões/opções/tags.
- Filtros e busca avançada.
- Duplicação e arquivamento.

### Fase 3 — Provas e publicação
- CRUD de provas/seções/itens.
- Prévia da prova.
- Publicação e geração de link público com validade.

### Fase 4 — Aplicação pública da prova
- Fluxo aluno (identificação → instruções → resolução).
- Autosave de respostas.
- Controle de tempo e submissão.
- Questionário final e confirmação.

### Fase 5 — Correção e consistência de notas
- Auto-correção objetiva.
- Fila de correção manual.
- Recalculo transacional de notas finais.

### Fase 6 — Dashboard e diagnósticos
- KPIs gerais/prova/turma/aluno.
- Gráficos de distribuição/acerto.
- Indicadores pedagógicos automáticos.

### Fase 7 — Monitoramento em tempo real
- Endpoint SSE + painel de acompanhamento.
- Estados: iniciaram, em andamento, enviados.

### Fase 8 — Relatórios e exportação
- Export CSV/XLSX com filtros.
- Página de relatórios consolidados.

### Fase 9 — Hardening para produção
- Limites/rate limiting.
- Sanitização reforçada e validações de upload.
- Observabilidade mínima (logs estruturados).
- Ajustes de deploy (Docker/Vercel/Fly/Render).

### Ordem recomendada de desenvolvimento
1. Fundação + auth.
2. Questões.
3. Provas/publicação.
4. Fluxo aluno.
5. Correção/manual.
6. Métricas/dashboard.
7. Tempo real.
8. Relatórios.
9. Hardening.

### Entregas incrementais sugeridas
- **Incremento A (MVP Aplicação):** login admin, questões, prova, link público, submissão básica.
- **Incremento B (Avaliação Completa):** confiança por questão, feedback final, correção manual.
- **Incremento C (Inteligência Pedagógica):** dashboard completo + diagnósticos + exportações + monitoramento.

---

## Observações de qualidade e governança
- Adotar contratos de API versionados (`/api/v1`).
- Cobertura mínima de testes: validações, regras de score e fluxo de submissão.
- Política de retenção de dados e anonimização opcional para análises históricas.
- Preparar feature flags para novas métricas sem quebrar o fluxo principal.
