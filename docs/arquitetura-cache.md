# Arquitetura de Cache e Otimização de Banco de Dados

Esta documentação descreve a estratégia de cache implementada no projeto para mitigar o alto volume de requisições desnecessárias ao banco de dados (Prisma/Aiven), especialmente durante o desenvolvimento (hot-reloads) e em horários de pico de acessos.

## O Problema
No Next.js (App Router), componentes renderizados no servidor (Server Components) que dependem de sessão ou de cookies (como o `getAdminOrRedirect()`) causam com que a rota inteira seja tratada como **Dinâmica**. Isso significa que as consultas diretas com `prisma.entity.find()` eram executadas repetidas vezes a cada *reload* ou carregamento de página, saturando as conexões do banco de dados com informações estáticas (como listas de turmas ou disciplinas).

## A Solução (Next.js `unstable_cache`)
Para resolver isso, isolamos as consultas que retornam dados pouco mutáveis dentro da função `unstable_cache` do `next/cache`. Isso armazena a resposta em memória pelo tempo configurado (TTL) ou até ser revalidada via tag.

### Camadas e Estratégias de Cache Implementadas

#### 1. Lookups Universais (Dicionários Estáticos)
Criamos o serviço `src/server/services/lookups.ts` para dados estruturais que raramente mudam. Estes dados costumavam ser chamados repetidas vezes nos painéis do sistema para preenchimento de seletores (dropdowns).

- **Onde**: Disciplinas, Temas, Turmas.
- **Duração (TTL)**: 3600 segundos (1 hora).
- **Tags de Revalidação**: `["disciplines"]`, `["themes"]`, `["class-groups"]`.

#### 2. Relatórios e Dashboard Administrativo
Consultas analíticas pesadas (que exigem `COUNT`, médias e cálculos de performance cruzados) agora são cacheadas para suportar picos de uso coordenados (ex: vários administradores acessando ao mesmo tempo).

- **Onde**: `src/server/services/analytics.ts` (`getDashboardOverview` e `getExamAnalytics`).
- **Duração (TTL)**: 60 segundos.
- **Tags de Revalidação**: `["analytics"]`.

#### 3. Listagens de Gerenciamento
As páginas de listagens administrativas (como listar todas as provas e listar as questões) usam um cache curtíssimo apenas para **suportar reloads sequenciais imediatos**.

- **Onde**: `src/app/admin/questions/page.tsx` e `src/app/admin/exams/page.tsx`.
- **Duração (TTL)**: 15 segundos.
- **Tags de Revalidação**: `["questions"]`, `["exams"]`.

#### 4. Interface Pública da Prova e Resultados
- **Identificação da prova** (`exam/[slug]/page.tsx`): Dados da prova pública cacheados por **5 minutos** (tag `["public-exam"]`).
- **Feedback pedagógico** (`attempt/[attemptId]/feedback/page.tsx`): Estrutura base para carregar o questionário cacheada por **5 minutos**.
- **Resultado Consolidado** (`submitted/[attemptId]/page.tsx`): O resumo com a nota final (`attempt-result.ts`) entra em cache por **2 minutos** (tag `["attempt"]`).

---

## Como Revalidar (Atualizar) o Cache sob Demanda

Ao implementar operações de criação/atualização (Mutations) nas rotas de API, você deve chamar a revalidação da tag correspondente para que a interface reflita o dado recém-salvo instantaneamente.

**Exemplo de Caso de Uso:**
Se um administrador editar o nome de uma "Disciplina" na tela de configurações, a API de atualização deve rodar o seguinte código para destruir o cache de 1 hora:

```typescript
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  // Lógica para salvar nova disciplina no prisma...
  
  // Destruir o cache e atualizar toda a aplicação
  revalidateTag("disciplines");

  return NextResponse.json({ success: true });
}
```

### Lista Completa de Tags de Cache do Sistema
Utilize estas chaves no `revalidateTag` sempre que manipular o Prisma:
- `"disciplines"`
- `"themes"`
- `"class-groups"`
- `"analytics"`
- `"questions"`
- `"exams"`
- `"public-exam"`
- `"attempt"`

## Considerações
- Não aplique `unstable_cache` em páginas ativas de interação com o usuário (ex: `attempt/[attemptId]/page.tsx`), pois o auto-save interage constantemente com o banco e o usuário precisa ver a "verdade atual" para evitar conflitos de resposta.
- Em desenvolvimento local, se quiser forçar limpeza de cache enquanto edita os componentes, reiniciar o servidor (`npm run dev`) descarta o cache instável da memória.
