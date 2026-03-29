# AVA Online

Sistema web para criação, aplicação, monitoramento e análise de avaliações online.

O projeto possui:
- área pública do aluno com acesso por código da prova;
- área administrativa protegida para gestão da aplicação;
- monitoramento em tempo real;
- relatórios consolidados com exportação em PDF;
- módulo global de sugestões e reporte de problemas.

## Documentação
- Guia completo de instalação local: [docs/GUIA_INSTALACAO_LOCAL.md](docs/GUIA_INSTALACAO_LOCAL.md)
- Documento de apresentação do sistema: [docs/APRESENTACAO_DO_SISTEMA.md](docs/APRESENTACAO_DO_SISTEMA.md)

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

## Acessos rápidos
- Aplicação: `http://localhost:3000`
- Login do admin: `http://localhost:3000/admin/login`

Credenciais da seed:
- Usuário: `admin@ava.local`
- Senha: `admin123`

Código público da prova demo:
- `DEMO2026`

## Scripts úteis
```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

No Windows com bloqueio de execução do PowerShell, prefira:
```powershell
npm.cmd run dev
npx.cmd prisma migrate dev
npm.cmd run prisma:seed
```

## Observação importante
Se você estiver começando o projeto do zero no ambiente local, leia primeiro o guia:

[docs/GUIA_INSTALACAO_LOCAL.md](docs/GUIA_INSTALACAO_LOCAL.md)
