# AVA Online

Sistema web para criacao, aplicacao, monitoramento e analise de avaliacoes online.

O projeto possui:
- area publica do aluno com acesso por codigo da prova;
- area administrativa protegida com perfis `ADM` e `VISUALIZADOR`;
- monitoramento em tempo real por polling;
- relatorios consolidados com exportacao em PDF;
- link compartilhavel de visualizacao de relatorios;
- modulo global de sugestoes e reporte de problemas;
- uploads compativeis com ambiente local e com Vercel Blob em producao.

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

## Scripts uteis
```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
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
