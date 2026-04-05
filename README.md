# AVA Online

Sistema web para criacao, aplicacao, monitoramento e analise de avaliacoes online.

O projeto possui:
- area publica do aluno com acesso por codigo da prova;
- consulta publica posterior por ID da tentativa;
- area administrativa protegida com perfis `ADM` e `VISUALIZADOR`;
- cadastro e vinculo de temas em provas e questoes;
- importacao em massa de disciplinas, temas e turmas por JSON e Excel;
- monitoramento em tempo real por polling;
- resultado final do aluno com exportacao individual em PDF;
- relatorios consolidados com exportacao visual em PDF;
- link compartilhavel de visualizacao de relatorios;
- modulo global de sugestoes e reporte de problemas;
- painel de configuracoes com backup e reset seguro da base;
- feedback visual de carregamento em acoes assincronas relevantes;
- uploads compativeis com ambiente local e com Vercel Blob em producao.

## Atualizacoes desde o ultimo commit
- temas passaram a ser entidade propria, com vinculo em questoes e provas;
- provas agora exigem vinculo obrigatorio com turma e podem concentrar temas para feedback e analytics;
- a home publica foi dividida em dois fluxos:
  - realizar prova por codigo;
  - consultar desempenho por `ID da tentativa`;
- a identificacao do aluno ficou mais enxuta:
  - o sistema usa turma e disciplina da propria prova;
  - o formulario solicita apenas o nome do aluno;
- o resultado final agora destaca o `ID da tentativa` para consulta posterior;
- disciplinas, temas e turmas passaram a aceitar importacao em lote por JSON e `.xlsx`, com modelo padrao, preview e validacao;
- foi criado o modulo `Configuracoes` para backup manual, backup automatico antes de reset e listagem de backups recentes;
- foram adicionados scripts seguros de manutencao da base:
  - `npm run db:backup`
  - `npm run db:reset:safe`
  - `npm run db:reset:safe:seed`
- o frontend ganhou estados de loading reutilizaveis em navegacao, CRUD, importacao, exportacao, monitoramento e fluxo publico.

## Documentacao
- Guia completo de instalacao local: [docs/GUIA_INSTALACAO_LOCAL.md](docs/GUIA_INSTALACAO_LOCAL.md)
- Guia de deploy online com Vercel + Railway + Vercel Blob: [docs/DEPLOY_VERCEL_RAILWAY_BLOB.md](docs/DEPLOY_VERCEL_RAILWAY_BLOB.md)
- Documento de apresentacao do sistema: [docs/APRESENTACAO_DO_SISTEMA.md](docs/APRESENTACAO_DO_SISTEMA.md)
- Arquitetura tecnica atual: [ARQUITETURA_AVALIACOES_ONLINE.md](ARQUITETURA_AVALIACOES_ONLINE.md)

## Stack
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- MySQL
- Recharts
- Zod
- pdf-lib
- html2canvas
- jspdf
- xlsx
- @vercel/blob

## Acessos rapidos
- Aplicacao: `http://localhost:3000`
- Login interno: `http://localhost:3000/admin/login`

Credenciais da seed:
- Usuario: `admin@ava.local`
- Senha: `admin123`

Codigo publico da prova demo:
- `DEMO2026`

## Variaveis de ambiente principais
```env
DATABASE_URL="mysql://root:@localhost:3306/ava_online"
JWT_SECRET="change-me-super-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
BLOB_READ_WRITE_TOKEN=""
```

Notas:
- `UPLOAD_DIR` e usado no ambiente local.
- `BLOB_READ_WRITE_TOKEN` ativa uploads persistentes no Vercel Blob.
- Em producao no Vercel, o recomendado e usar `BLOB_READ_WRITE_TOKEN`.
- `.env.local` sobrescreve `.env` no `next dev`. Se existir `DATABASE_URL` nos dois arquivos, o valor de `.env.local` vence.
- Se voce quiser rodar localmente usando o mesmo banco do deploy, mantenha `DATABASE_URL` apenas em `.env`.

## Scripts uteis
```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run db:backup
npm run db:reset:safe
npm run db:reset:safe:seed
```

No Windows com bloqueio de execucao do PowerShell, prefira:
```powershell
npm.cmd run dev
npx.cmd prisma migrate dev
npm.cmd run prisma:seed
```

## Observacao importante
Se voce estiver comecando do zero:
1. leia o guia local: [docs/GUIA_INSTALACAO_LOCAL.md](docs/GUIA_INSTALACAO_LOCAL.md)
2. para publicar online, siga o guia: [docs/DEPLOY_VERCEL_RAILWAY_BLOB.md](docs/DEPLOY_VERCEL_RAILWAY_BLOB.md)
