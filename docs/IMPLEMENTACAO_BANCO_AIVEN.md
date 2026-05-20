# Implementacao do Banco com Aiven

Este guia explica como configurar o banco MySQL do AVA Online usando Aiven.

O projeto usa Prisma com MySQL, definido em `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Por isso, a integracao com Aiven depende principalmente da variavel `DATABASE_URL`.

## 1. O que voce precisa ter

Antes de comecar:
- conta no Aiven;
- projeto local funcionando;
- dependencias instaladas com `npm install`;
- acesso ao painel do projeto no Vercel, se for publicar online.

## 2. Criar o servico MySQL no Aiven

1. Entre em `https://console.aiven.io`.
2. Crie um novo servico.
3. Escolha `MySQL`.
4. Escolha o cloud provider, regiao e plano.
5. Aguarde o status ficar como `Running`.

Recomendacao:
- use uma regiao proxima dos usuarios ou da aplicacao;
- se a aplicacao estiver no Vercel, prefira uma regiao compativel com o deploy para reduzir latencia.

## 3. Obter as credenciais

No servico MySQL do Aiven, abra a area de `Connection information`.

Copie:
- `Host`;
- `Port`;
- `User`;
- `Password`;
- `Database`;
- `Service URI`, se estiver disponivel.

O banco padrao costuma ser `defaultdb`. Voce pode usar ele ou criar outro banco no proprio painel do Aiven.

## 4. Configurar a `DATABASE_URL`

Formato esperado pelo Prisma:

```env
DATABASE_URL="mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO?sslaccept=strict"
```

Exemplo com placeholders:

```env
DATABASE_URL="mysql://avnadmin:SENHA_DO_AIVEN@mysql-xxxxx.a.aivencloud.com:12345/defaultdb?sslaccept=strict"
```

Importante:
- troque `SENHA_DO_AIVEN`, `mysql-xxxxx.a.aivencloud.com`, `12345` e `defaultdb` pelos dados reais do Aiven;
- se a senha tiver caracteres especiais como `@`, `#`, `%`, `/`, `?` ou `&`, codifique esses caracteres na URL;
- mantenha `sslaccept=strict` para exigir conexao TLS no Prisma.

## 5. Exemplo de `.env`

Para desenvolvimento local usando o banco do Aiven:

```env
DATABASE_URL="mysql://avnadmin:SENHA_DO_AIVEN@mysql-xxxxx.a.aivencloud.com:12345/defaultdb?sslaccept=strict"
JWT_SECRET="troque-por-uma-chave-forte"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
BLOB_READ_WRITE_TOKEN=""
```

Para producao no Vercel:

```env
DATABASE_URL="mysql://avnadmin:SENHA_DO_AIVEN@mysql-xxxxx.a.aivencloud.com:12345/defaultdb?sslaccept=strict"
JWT_SECRET="troque-por-uma-chave-forte"
NEXT_PUBLIC_APP_URL="https://seu-projeto.vercel.app"
BLOB_READ_WRITE_TOKEN="seu-token-do-vercel-blob"
```

Observacoes:
- `UPLOAD_DIR` e usado principalmente em ambiente local;
- em producao no Vercel, use `BLOB_READ_WRITE_TOKEN` para uploads persistentes;
- `.env.local` sobrescreve `.env` durante o `next dev`.

## 6. Gerar um `JWT_SECRET`

No terminal:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use o valor gerado em `JWT_SECRET`.

## 7. Validar conexao local

Depois de preencher o `.env`, rode:

```powershell
npx.cmd prisma generate
```

Em seguida, valide a conexao aplicando as migrations.

Para banco remoto que sera tratado como ambiente persistente:

```powershell
npx.cmd prisma migrate deploy
```

Para ambiente local descartavel de desenvolvimento:

```powershell
npx.cmd prisma migrate dev
```

Recomendacao:
- use `prisma migrate deploy` para Aiven em producao ou homologacao;
- evite `prisma migrate reset` em banco remoto com dados importantes.

## 8. Popular dados iniciais

Se o banco estiver novo e voce quiser criar os dados iniciais:

```powershell
npm.cmd run prisma:seed
```

A seed cria o usuario inicial:
- e-mail: `admin@ava.local`;
- senha: `admin123`.

Troque essa senha depois do primeiro acesso se o ambiente for compartilhado ou publico.

## 9. Configurar no Vercel

No painel do projeto no Vercel, abra:

`Settings > Environment Variables`

Cadastre:

```env
DATABASE_URL="mysql://avnadmin:SENHA_DO_AIVEN@mysql-xxxxx.a.aivencloud.com:12345/defaultdb?sslaccept=strict"
JWT_SECRET="chave-forte-gerada"
NEXT_PUBLIC_APP_URL="https://seu-projeto.vercel.app"
BLOB_READ_WRITE_TOKEN="seu-token-do-vercel-blob"
```

Depois disso:
1. rode um novo deploy;
2. confirme que o build passou;
3. acesse `/admin/login`;
4. valide provas, relatorios e uploads.

## 10. Comandos uteis

```powershell
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npm.cmd run prisma:seed
npm.cmd run build
npm.cmd run dev
```

## 11. Problemas comuns

### Erro de senha invalida

Confira se a senha foi copiada corretamente do Aiven.

Se a senha tiver caracteres especiais, eles precisam estar codificados na URL.

### Erro de conexao TLS ou SSL

Confirme se a URL possui:

```env
?sslaccept=strict
```

### Erro `P1001` do Prisma

Esse erro geralmente indica que o Prisma nao conseguiu acessar o banco.

Confira:
- host;
- porta;
- usuario;
- senha;
- nome do banco;
- status `Running` do servico no Aiven;
- regras de acesso ou firewall, caso tenham sido configuradas.

### Muitas conexoes abertas

Ambientes serverless podem abrir muitas conexoes em picos de uso.

Se isso acontecer:
- acompanhe o limite de conexoes do plano Aiven;
- reduza chamadas desnecessarias ao banco;
- avalie um plano maior se o uso for real;
- evite apontar muitos ambientes de preview para o mesmo banco.

## 12. Ordem recomendada

1. criar MySQL no Aiven;
2. copiar credenciais;
3. montar `DATABASE_URL` com `sslaccept=strict`;
4. atualizar `.env` local;
5. rodar `npx.cmd prisma generate`;
6. rodar `npx.cmd prisma migrate deploy`;
7. rodar `npm.cmd run prisma:seed`, se for banco novo;
8. configurar as mesmas variaveis no Vercel;
9. fazer novo deploy;
10. validar login, provas, relatorios e uploads.

## 13. Referencias

- Aiven: informacoes de conexao e certificado ficam no painel do servico MySQL, em `Connection information`.
- Prisma MySQL: a URL de conexao usa o formato `mysql://user:password@host:port/database` e aceita parametros SSL como `sslaccept=strict`.
