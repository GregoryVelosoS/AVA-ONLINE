# Deploy Online com Vercel + Railway + Vercel Blob

Este documento explica como publicar o projeto completo:
- aplicacao Next.js no Vercel;
- banco MySQL no Railway;
- uploads persistentes no Vercel Blob.

Importante:
- este guia foi feito para voce seguir manualmente;
- ele nao executa nada por voce;
- a ideia e deixar frontend, backend, banco e uploads online.

## 1. Arquitetura recomendada

Use esta combinacao:

- `GitHub`: repositorio do codigo
- `Vercel`: hospeda frontend e backend do Next.js
- `Railway MySQL`: banco de dados online
- `Vercel Blob`: arquivos e imagens persistentes

## 2. O que voce precisa ter

Antes de comecar:
- conta no GitHub
- conta no Vercel
- conta no Railway
- projeto publicado no GitHub
- projeto funcionando localmente

## 3. Validar o projeto antes do deploy

No seu computador, rode:

```powershell
npx.cmd prisma generate
npx.cmd next build
```

Se quiser validar com mais seguranca:

```powershell
npm.cmd run dev
```

## 4. Criar o banco MySQL no Railway

### 4.1 Criar o servico
1. Entre em `https://railway.com`
2. Clique em `New Project`
3. Escolha `Provision MySQL`

### 4.2 Obter as credenciais
No painel do MySQL:
1. abra `Variables`
2. copie:
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`

Se o Railway fornecer `MYSQL_URL`, use essa URL diretamente.

## 5. Definir a `DATABASE_URL`

Formato esperado:

```env
DATABASE_URL="mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"
```

## 6. Aplicar schema no banco online

No seu computador, apontando o `.env` para o banco do Railway, rode:

```powershell
npx.cmd prisma migrate deploy
```

Se quiser popular o ambiente com dados iniciais:

```powershell
npm.cmd run prisma:seed
```

Importante:
- use `migrate deploy` para banco online;
- evite `migrate dev` em ambiente que voce quer tratar como producao.

## 7. Criar um Blob Store no Vercel

### 7.1 Criar o storage
1. Entre no painel do Vercel
2. Abra `Storage`
3. Crie um `Blob Store`

### 7.2 Obter a variavel
O Vercel vai disponibilizar:

```env
BLOB_READ_WRITE_TOKEN
```

Essa variavel e necessaria para que o projeto salve arquivos no Blob em producao.

## 8. Importar o projeto no Vercel

1. Entre em `https://vercel.com`
2. Clique em `Add New Project`
3. Escolha `Import Git Repository`
4. Selecione o repositorio do GitHub
5. Confirme o framework `Next.js`

## 9. Configurar variaveis de ambiente no Vercel

No projeto do Vercel, abra:

`Settings > Environment Variables`

Cadastre:

### Obrigatorias
```env
DATABASE_URL=mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
JWT_SECRET=uma-chave-forte
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
BLOB_READ_WRITE_TOKEN=seu-token-do-blob
```

### Opcional para ambiente local
```env
UPLOAD_DIR=./uploads
```

Observacao:
- no Vercel, a persistencia correta de upload e `BLOB_READ_WRITE_TOKEN`;
- `UPLOAD_DIR` serve principalmente para desenvolvimento local.

## 10. Gerar um `JWT_SECRET`

No terminal:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e use em `JWT_SECRET`.

## 11. Fazer o primeiro deploy

Depois de configurar as env vars:

1. clique em `Deploy`
2. aguarde o build finalizar
3. abra a URL publica do Vercel

## 12. Ajustar a URL publica real

Se o Vercel gerar algo como:

```text
https://seu-projeto.vercel.app
```

garanta que `NEXT_PUBLIC_APP_URL` use exatamente essa URL.

Se precisar, atualize a variavel e rode novo deploy.

## 13. Testar o sistema online

### Fluxo publico
- abrir `/`
- informar codigo da prova
- iniciar tentativa
- enviar prova
- validar a tela final com `Exportar PDF`

### Fluxo admin
- login em `/admin/login`
- dashboard
- provas
- relatorios
- usuarios
- exportacao visual do PDF em `/admin/reports`

### Fluxo visualizador
- login com usuario `VISUALIZADOR`
- acesso apenas a `/admin/reports`

### Uploads
Teste:
- upload de imagem/arquivo em questoes
- envio de sugestao com imagem

Se o `BLOB_READ_WRITE_TOKEN` estiver correto, esses arquivos passam a ser salvos no Vercel Blob.

## 14. Como o projeto se comporta com uploads

Hoje o projeto funciona assim:

### Sem `BLOB_READ_WRITE_TOKEN`
- usa `UPLOAD_DIR`
- ideal para ambiente local

### Com `BLOB_READ_WRITE_TOKEN`
- salva no Vercel Blob
- ideal para producao no Vercel

Ou seja, o projeto atual ja esta preparado para os dois cenarios.

## 15. Dominio proprio

Se quiser usar dominio proprio:

1. abra `Settings > Domains` no Vercel
2. clique em `Add Domain`
3. adicione seu dominio
4. ajuste o DNS conforme o Vercel orientar
5. atualize `NEXT_PUBLIC_APP_URL`
6. faca novo deploy

## 16. Cuidados importantes

### Banco de producao
- use `prisma migrate deploy`
- evite `migrate reset`

### Preview deployments
Nao aponte previews para o mesmo banco de producao sem controle.

### Uploads
Nao use pasta local como estrategia final no Vercel.
O recomendado e o que o projeto ja suporta agora:
- Vercel Blob

## 17. Ordem recomendada de publicacao

Siga esta ordem:

1. validar build local
2. criar banco MySQL no Railway
3. configurar `DATABASE_URL`
4. rodar `prisma migrate deploy`
5. opcionalmente rodar seed
6. criar Blob Store no Vercel
7. obter `BLOB_READ_WRITE_TOKEN`
8. importar projeto no Vercel
9. configurar env vars
10. fazer deploy
11. testar login, relatorios e uploads

## 18. Variaveis finais esperadas em producao

```env
DATABASE_URL="mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"
JWT_SECRET="chave-forte"
NEXT_PUBLIC_APP_URL="https://seu-projeto.vercel.app"
BLOB_READ_WRITE_TOKEN="seu-token-do-vercel-blob"
```

## 19. Resultado final esperado

Ao fim do processo, voce tera:
- frontend online;
- backend online;
- banco online;
- uploads persistentes;
- login interno funcionando;
- relatorios e monitoramento online;
- exportacao individual do resultado do aluno;
- exportacao visual dos relatorios em PDF.
