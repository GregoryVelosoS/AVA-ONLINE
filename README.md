# AVA Online

Sistema web para aplicação de avaliações online com link público para alunos e área administrativa exclusiva para professor/administrador.

## O que já está implementado nesta entrega

### ✅ Núcleo funcional (MVP estruturado)
- Login de Admin com cookie HTTP-only e JWT.
- Proteção de rotas `/admin/*` via middleware + guard de servidor.
- Banco relacional modelado em Prisma (PostgreSQL) com entidades centrais:
  - AdminUser, Exam, ExamSection, Question, QuestionOption, ExamQuestion,
  - PublicExamLink, StudentAttempt, StudentProfileSnapshot, Answer,
  - AnswerAttachment, ManualCorrection, FeedbackFormResponse, Discipline,
  - ClassGroup, Tag.
- Seed inicial com:
  - usuário admin demo (`admin@ava.local` / `admin123`);
  - disciplina, questão objetiva exemplo;
  - prova publicada com link público (`/exam/demo`).
- Fluxo público do aluno:
  - acesso por link;
  - identificação (nome/turma/disciplina);
  - resolução da prova;
  - resposta com nível de confiança (1..3);
  - feedback final;
  - submissão com confirmação.
- Correção automática para múltipla escolha e recomputação de nota por tentativa.
- Dashboard administrativo com KPIs iniciais (total provas, alunos, conclusão, média, tempo médio).
- APIs iniciais para CRUD base de questões/provas e ciclo de tentativa.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Zod para validações
- Recharts (preparado)

## Como executar

### 1) Pré-requisitos
- Node.js 20+
- PostgreSQL 16+

### 2) Instalação
```bash
npm install
cp .env.example .env
```

### 3) Banco
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4) Subir aplicação
```bash
npm run dev
```

Acesse:
- Home: `http://localhost:3000`
- Login Admin: `http://localhost:3000/admin/login`
- Prova demo: `http://localhost:3000/exam/demo`

## Endpoints principais

### Auth
- `POST /api/auth/login`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/admin/questions`
- `POST /api/admin/questions`
- `GET /api/admin/exams`
- `POST /api/admin/exams`

### Público (Aluno)
- `POST /api/public/attempts/start`
- `POST /api/public/attempts/answer`
- `POST /api/public/attempts/submit`

## Próximos passos recomendados
1. Completar telas de criação/edição com formulários ricos.
2. Implementar upload de arquivo com storage adapter (local/S3).
3. Adicionar correção manual completa com comentários por resposta.
4. Expandir dashboard com gráficos por turma, tag, nível e diagnósticos pedagógicos.
5. Exportação CSV/XLSX e monitoramento em tempo real (SSE/polling).
6. Testes automatizados (unit + integração + e2e).

## Observações
- Este projeto já está organizado para evolução incremental e deploy.
- Não há coleta de dados além do necessário para execução da avaliação (LGPD básica).
