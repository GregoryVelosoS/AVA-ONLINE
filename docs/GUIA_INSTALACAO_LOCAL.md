# Guia de Instalação Local

Este documento explica, passo a passo, como instalar e rodar o projeto AVA Online localmente.

## 1. Visão geral do que você vai precisar

Antes de iniciar, tenha instalado na máquina:
- Node.js 20 ou superior
- MySQL 8 ou superior
- npm
- Git

Também é recomendado ter:
- VS Code
- MySQL Workbench, HeidiSQL, DBeaver ou outro cliente de banco

## 2. Tecnologias usadas no projeto

O projeto roda com:
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- MySQL

## 3. Baixar o projeto

Se o projeto ainda não estiver na sua máquina:

```bash
git clone <url-do-repositorio>
cd ava-online
```

Se ele já estiver aberto no VS Code, basta seguir os próximos passos.

## 4. Instalar dependências

### Linux / macOS
```bash
npm install
```

### Windows
Se o PowerShell bloquear scripts do `npm`, use:

```powershell
npm.cmd install
```

## 5. Configurar o arquivo `.env`

O projeto já possui um modelo em `.env.example`.

Crie uma cópia para `.env`:

### Linux / macOS
```bash
cp .env.example .env
```

### Windows
```powershell
Copy-Item .env.example .env
```

Conteúdo base esperado:

```env
DATABASE_URL="mysql://root:@localhost:3306/ava_online"
JWT_SECRET="change-me-super-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
```

## 6. Configurar o banco MySQL

O projeto usa MySQL.

Você precisa:
1. garantir que o serviço do MySQL esteja rodando;
2. criar o banco `ava_online`;
3. ajustar usuário e senha no `.env`.

### Exemplo para criar o banco
No MySQL:

```sql
CREATE DATABASE ava_online;
```

Se seu MySQL tiver usuário e senha diferentes de `root` sem senha, ajuste a `DATABASE_URL`.

Exemplo:

```env
DATABASE_URL="mysql://root:minha_senha@localhost:3306/ava_online"
```

## 7. Gerar o Prisma Client

### Linux / macOS
```bash
npx prisma generate
```

### Windows
```powershell
npx.cmd prisma generate
```

## 8. Rodar as migrations

Esse passo cria todas as tabelas e estrutura o banco com base no schema atual.

### Linux / macOS
```bash
npx prisma migrate dev
```

### Windows
```powershell
npx.cmd prisma migrate dev
```

Se quiser dar um nome manual à migration no seu ambiente:

```powershell
npx.cmd prisma migrate dev --name init
```

## 9. Popular o banco com dados iniciais

O projeto possui seed com:
- usuário administrador padrão;
- disciplina inicial;
- tag inicial;
- questão exemplo;
- prova demo publicada.

### Linux / macOS
```bash
npm run prisma:seed
```

### Windows
```powershell
npm.cmd run prisma:seed
```

## 10. Subir o projeto

### Linux / macOS
```bash
npm run dev
```

### Windows
```powershell
npm.cmd run dev
```

Depois acesse:
- Aplicação: `http://localhost:3000`
- Login admin: `http://localhost:3000/admin/login`

## 11. Credenciais iniciais

Após rodar a seed, você pode entrar no admin com:

- E-mail: `admin@ava.local`
- Senha: `admin123`

Também existe uma prova demo com código público:

- `DEMO2026`

## 12. Fluxo básico para validar que tudo funcionou

Faça este teste rápido:

1. abra `http://localhost:3000`;
2. informe o código `DEMO2026`;
3. avance para a etapa de identificação do aluno;
4. entre no admin em `http://localhost:3000/admin/login`;
5. confirme se as telas de dashboard, provas, monitoramento e relatórios carregam.

## 13. Scripts úteis do projeto

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## 14. Como validar em produção local antes de apresentar

Se quiser testar o build real:

### Linux / macOS
```bash
npm run build
npm run start
```

### Windows
```powershell
npm.cmd run build
npm.cmd run start
```

## 15. Estrutura principal do projeto

Pastas mais importantes:

- `src/app`
  rotas, páginas e APIs do Next.js

- `src/components`
  componentes reutilizáveis de admin, aluno, dashboard e interface

- `src/server`
  serviços, validações, autenticação e acesso ao banco

- `prisma`
  schema, migrations e seed

- `docs`
  documentação do projeto

## 16. Rotas principais

### Públicas
- `/`
- `/attempt/[attemptId]`
- `/attempt/[attemptId]/feedback`
- `/submitted/[attemptId]`

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

## 17. Problemas comuns e como resolver

### 17.1 PowerShell bloqueando `npm` ou `npx`

Use `npm.cmd` e `npx.cmd` em vez de `npm` e `npx`.

Exemplo:

```powershell
npm.cmd run dev
npx.cmd prisma migrate dev
```

### 17.2 Erro de autenticação no MySQL

Se aparecer erro de credencial:
- confira usuário e senha do MySQL;
- revise a `DATABASE_URL`;
- confirme se o banco `ava_online` existe;
- confirme se o MySQL está ativo na porta `3306`.

### 17.3 Erro de migration antiga ou banco inconsistente

Se o banco local estiver desalinado com as migrations e você puder perder os dados de desenvolvimento, use:

```powershell
npx.cmd prisma migrate reset
```

Depois rode novamente:

```powershell
npm.cmd run prisma:seed
```

Importante:
- isso apaga os dados do banco local de desenvolvimento;
- não use em ambiente com dados que precisem ser preservados.

### 17.4 Prisma travado no Windows com erro de `EPERM`

Às vezes o `next dev` mantém o engine do Prisma bloqueado.

Se isso acontecer:
1. pare o servidor `npm run dev`;
2. rode novamente `npx.cmd prisma generate`;
3. depois suba a aplicação outra vez.

### 17.5 Porta 3000 ocupada

Pare o processo que já está usando a porta ou rode o projeto em outra porta.

Exemplo:

```powershell
$env:PORT=3001; npm.cmd run dev
```

## 18. O que o projeto já entrega hoje

O sistema já possui:
- login admin protegido;
- dashboard inicial do admin;
- gestão de provas, questões, turmas e disciplinas;
- acesso público do aluno por código da prova;
- prova com timer e feedback visual;
- monitoramento em tempo real;
- relatórios consolidados;
- exportação em PDF;
- link compartilhável de visualização de relatório;
- módulo de sugestões e reporte de problemas com imagem;
- feedback pedagógico final estruturado.

## 19. Pontos que merecem atenção no uso local

No estado atual do projeto:
- o fluxo principal está funcional;
- a seed serve para demonstração;
- alguns dados de apresentação dependem de existirem tentativas reais no banco;
- quanto mais respostas você gerar, mais completos ficam monitoramento e relatórios.

## 20. Ordem recomendada de setup

Se você quiser o passo mais seguro, siga exatamente esta ordem:

1. instalar Node.js e MySQL;
2. criar o banco `ava_online`;
3. copiar `.env.example` para `.env`;
4. ajustar `DATABASE_URL`;
5. rodar `npm install`;
6. rodar `npx prisma generate`;
7. rodar `npx prisma migrate dev`;
8. rodar `npm run prisma:seed`;
9. rodar `npm run dev`;
10. acessar a aplicação e validar login + prova demo.
