# Guia de Instalacao Local

Este documento explica, passo a passo, como instalar e rodar o AVA Online localmente.

## 1. Pre-requisitos

Tenha instalado na maquina:
- Node.js 20 ou superior
- MySQL 8 ou superior
- npm
- Git

Opcional, mas recomendado:
- VS Code
- DBeaver, MySQL Workbench, HeidiSQL ou outro cliente SQL

## 2. Baixar o projeto

Se ainda nao estiver com o projeto na maquina:

```bash
git clone <url-do-repositorio>
cd ava-online
```

## 3. Instalar dependencias

### Linux / macOS
```bash
npm install
```

### Windows
```powershell
npm.cmd install
```

## 4. Configurar `.env`

Copie o modelo:

### Linux / macOS
```bash
cp .env.example .env
```

### Windows
```powershell
Copy-Item .env.example .env
```

Conteudo base:

```env
DATABASE_URL="mysql://root:@localhost:3306/ava_online"
JWT_SECRET="change-me-super-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
BLOB_READ_WRITE_TOKEN=""
```

### O que cada variavel faz
- `DATABASE_URL`: conexao com o MySQL
- `JWT_SECRET`: assinatura dos tokens de login
- `NEXT_PUBLIC_APP_URL`: URL da aplicacao
- `UPLOAD_DIR`: pasta local de uploads em desenvolvimento
- `BLOB_READ_WRITE_TOKEN`: storage persistente no Vercel Blob

Importante:
- no ambiente local, `BLOB_READ_WRITE_TOKEN` pode ficar vazio;
- sem essa variavel, o projeto usa `UPLOAD_DIR`;
- com essa variavel, o projeto usa Vercel Blob.

## 5. Criar o banco MySQL

Crie o banco:

```sql
CREATE DATABASE ava_online;
```

Se seu MySQL tiver usuario e senha diferentes, ajuste a `DATABASE_URL`.

Exemplo:

```env
DATABASE_URL="mysql://root:minha_senha@localhost:3306/ava_online"
```

## 6. Gerar Prisma Client

### Linux / macOS
```bash
npx prisma generate
```

### Windows
```powershell
npx.cmd prisma generate
```

## 7. Rodar migrations

### Linux / macOS
```bash
npx prisma migrate dev
```

### Windows
```powershell
npx.cmd prisma migrate dev
```

Se o banco local estiver inconsistente e voce puder apagar os dados de desenvolvimento:

```powershell
npm.cmd run db:reset:safe
```

Se quiser resetar e reaplicar a seed em seguida:

```powershell
npm.cmd run db:reset:safe:seed
```

## 8. Rodar a seed

A seed cria:
- usuario `ADM` inicial;
- disciplina inicial;
- turma inicial;
- tema inicial;
- tag inicial;
- questao exemplo;
- prova demo com codigo publico e tema vinculado.

### Linux / macOS
```bash
npm run prisma:seed
```

### Windows
```powershell
npm.cmd run prisma:seed
```

## 9. Subir a aplicacao

### Linux / macOS
```bash
npm run dev
```

### Windows
```powershell
npm.cmd run dev
```

Acesse:
- Aplicacao: `http://localhost:3000`
- Login interno: `http://localhost:3000/admin/login`

## 10. Credenciais iniciais

Depois da seed:

- E-mail: `admin@ava.local`
- Senha: `admin123`

Prova demo:
- Codigo publico: `DEMO2026`

## 11. Perfis internos

Hoje o sistema possui dois perfis internos:

### ADM
- acesso total;
- pode gerenciar provas, questoes, temas, turmas, disciplinas, monitoramento, relatorios, sugestoes, usuarios e configuracoes.

### VISUALIZADOR
- acesso somente a relatorios;
- nao ve menus administrativos criticos;
- nao pode criar, editar ou excluir dados do sistema.

## 12. Teste rapido de validacao

Depois de subir o projeto:

1. abra `http://localhost:3000`
2. informe `DEMO2026`
3. avance para identificacao do aluno
4. preencha apenas o nome
5. inicie a prova
6. finalize a prova e valide o botao `Exportar PDF` na tela final
7. copie o `ID da tentativa` exibido no resultado final
8. volte para `/` e teste a consulta da tentativa pelo ID copiado
9. abra `http://localhost:3000/admin/login`
10. entre com o usuario seed
11. teste:
- `/admin/dashboard`
- `/admin/exams`
- `/admin/themes`
- `/admin/reports`
- `/admin/settings`
- `/admin/users`
- importacao em lote em `/admin/disciplines`, `/admin/themes` e `/admin/class-groups`
- exportacao PDF do relatorio na pagina de relatorios
- backup manual e reset protegido na pagina de configuracoes

## 13. Uploads no ambiente local

Sem `BLOB_READ_WRITE_TOKEN`, o sistema salva arquivos localmente em:

```env
UPLOAD_DIR="./uploads"
```

Isso atende o ambiente local.

Em producao no Vercel, o recomendado e usar `BLOB_READ_WRITE_TOKEN` com Vercel Blob.

## 14. Scripts uteis

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run db:backup
npm run db:reset:safe
npm run db:reset:safe:seed
```

## 15. Problemas comuns

### PowerShell bloqueando `npm` ou `npx`

Use:

```powershell
npm.cmd run dev
npx.cmd prisma migrate dev
```

### Erro de autenticacao no MySQL

Confira:
- usuario
- senha
- porta
- banco criado

### Prisma travado no Windows com `EPERM`

Pare o `next dev`, rode de novo `prisma generate` e depois suba a aplicacao novamente.

### Erro em migrations antigas

Se estiver em ambiente de desenvolvimento e puder apagar dados:

```powershell
npm.cmd run db:reset:safe:seed
```

## 16. Ordem recomendada

Siga esta ordem:

1. instalar Node.js e MySQL
2. copiar `.env.example` para `.env`
3. ajustar `DATABASE_URL`
4. rodar `npm install`
5. rodar `npx prisma generate`
6. rodar `npx prisma migrate dev`
7. rodar `npm run prisma:seed`
8. rodar `npm run dev`
9. validar login, prova demo, consulta por ID da tentativa, importacoes em lote e relatorios
