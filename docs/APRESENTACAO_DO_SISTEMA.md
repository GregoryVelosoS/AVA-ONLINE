# Apresentação do Sistema

Este documento resume o que o AVA Online faz hoje, como o sistema está organizado e quais são os principais fluxos para demonstração.

## 1. O que é o AVA Online

O AVA Online é uma plataforma para:
- criar avaliações online;
- aplicar provas para alunos sem cadastro;
- acompanhar a execução em tempo real;
- analisar resultados consolidados;
- coletar feedback pedagógico ao final da prova.

O foco do sistema é dar ao professor ou administrador uma visão operacional e pedagógica da avaliação, desde a criação até a análise final.

## 2. Perfis de uso

O sistema hoje trabalha com três contextos de acesso:

### Admin
Possui acesso completo à área administrativa.

Pode:
- fazer login;
- criar e editar provas;
- cadastrar questões;
- gerenciar turmas e disciplinas;
- acompanhar monitoramento em tempo real;
- acessar relatórios;
- exportar PDF;
- gerar link de visualização de relatório;
- visualizar sugestões e erros enviados pelos usuários.

### Aluno
Não possui cadastro próprio no sistema.

O acesso é feito:
- pela tela pública inicial;
- com código público da prova;
- seguido de identificação com nome, turma e disciplina.

Depois disso, o aluno realiza a prova e preenche o feedback final.

### Visualização externa
O sistema não cria hoje um usuário autenticado separado para visualizador.

Em vez disso, o admin pode:
- gerar um link compartilhável de relatório;
- entregar esse link para visualização externa em modo leitura.

Essa foi a solução mais compatível com a arquitetura atual.

## 3. Fluxo principal do aluno

O fluxo público funciona assim:

1. o aluno entra na página inicial;
2. informa o código da prova;
3. o sistema valida esse código;
4. se a prova estiver disponível, abre a etapa de identificação;
5. o aluno informa nome, turma e disciplina;
6. inicia a prova;
7. responde as questões com nível de confiança;
8. envia a prova;
9. preenche o formulário final de feedback pedagógico;
10. visualiza a tela final com desempenho, feedback e resumo de estudos.

## 4. Acesso por código da prova

Uma das mudanças centrais do sistema foi o acesso por código público.

Hoje a prova possui:
- nome;
- código público único;
- disciplina;
- duração;
- status.

O código público:
- não expõe o ID interno do banco;
- é fácil de informar ao aluno;
- pode ser validado antes da identificação;
- respeita disponibilidade e status da prova.

Mensagens tratadas no fluxo:
- código inválido;
- prova inexistente;
- prova desativada;
- prova encerrada;
- prova expirada.

## 5. Ciclo de vida da prova

As provas possuem um ciclo de vida administrativo mais completo.

Hoje o admin consegue:
- criar prova;
- editar prova;
- definir código público;
- definir duração;
- ativar;
- desativar;
- encerrar;
- excluir, com validação e controle;
- acessar monitoramento;
- acessar relatórios.

Status usados no fluxo atual:
- rascunho;
- publicada/ativa;
- encerrada;
- arquivada;

Na prática, isso ajuda a evitar poluição com provas antigas ou de teste.

## 6. Gestão de questões

O sistema permite montar e organizar banco de questões.

Suporta:
- múltipla escolha;
- texto curto;
- texto longo;
- envio de arquivo como tipo de questão cadastrado;

Na edição de questão, a estrutura visual segue:
1. contexto;
2. suporte visual;
3. comando da questão;
4. alternativas;

Também é possível cadastrar:
- feedback esperado;
- explicação da resposta;
- temas para estudo;
- links de apoio;
- playlist ou URL de referência;
- observações complementares.

## 7. Suporte visual da questão

Uma questão pode ter apoio visual em dois formatos:

### Imagem ou arquivo
- upload de arquivo/imagem;
- preview quando aplicável;
- exibição do nome do arquivo;
- persistência do vínculo com a questão.

### Bloco de código
- área monoespaçada;
- preservação de quebras de linha e identação;
- visualização organizada na prova.

## 8. Importação de questões

O admin pode importar questões por:
- JSON;
- Excel.

A interface também oferece:
- modelos padrão para download;
- instruções de preenchimento;
- validação básica do arquivo.

## 9. Turmas e disciplinas

O sistema possui cadastro administrativo de:
- turmas;
- disciplinas.

Esses cadastros hoje permitem:
- listar;
- criar;
- editar;
- excluir;
- pesquisar.

Essas informações alimentam o fluxo de identificação do aluno e os filtros analíticos.

## 10. Experiência da prova para o aluno

A tela da prova foi refinada para melhorar leitura e tomada de decisão.

Ela mostra:
- contexto da questão;
- suporte visual;
- comando;
- alternativas;
- nível de confiança.

Também apresenta:
- tempo decorrido;
- tempo restante;
- contagem regressiva;
- indicação de questão respondida;
- indicação de questão pendente;
- destaque claro de alternativa selecionada;
- destaque claro do nível de confiança selecionado.

Níveis de confiança:
- 1 = Chutei
- 2 = Tive dúvida
- 3 = Tenho certeza

## 11. Feedback pedagógico final

Ao final da prova, o aluno responde um formulário estruturado.

Esse formulário coleta:
- percepção de dificuldade;
- conteúdos com maior dificuldade;
- tipo de dificuldade;
- percepção do próprio desempenho;
- clareza das explicações;
- ritmo das aulas;
- utilidade dos exercícios;
- autonomia;
- formatos de aula;
- necessidade de revisão;
- dificuldade com ferramentas;
- comentário final.

Essas respostas são usadas para análise pedagógica posterior.

## 12. Tela final do aluno

Depois do envio da prova, o sistema exibe uma área final mais rica.

Ela pode mostrar:
- confirmação de envio;
- pontuação;
- acertos e erros;
- lista de questões;
- feedback esperado;
- explicação da resposta;
- temas para revisão;
- materiais sugeridos;
- resumo final do que estudar;
- botão para voltar à tela inicial.

Isso transforma a experiência final em algo mais pedagógico e não apenas operacional.

## 13. Dashboard inicial do admin

O dashboard inicial foi evoluído para funcionar como painel de entrada.

Ele apresenta:
- cards com dados rápidos;
- resumo da última prova;
- indicadores recentes;
- atalhos para módulos principais.

Objetivo:
- facilitar a leitura rápida do sistema logo após o login;
- evitar uma tela inicial vazia;
- direcionar o admin para as ações mais importantes.

## 14. Monitoramento em tempo real

O módulo de monitoramento foi separado para ter responsabilidade operacional.

Ele serve para acompanhar a aplicação da prova enquanto ela está acontecendo.

A tela mostra:
- provas em execução;
- quantidade de alunos em andamento;
- quantidade de alunos finalizados;
- andamento por prova;
- andamento por aluno;
- atualização automática por polling.

Essa área não é o relatório final.
Ela é voltada para acompanhamento do momento da aplicação.

## 15. Relatórios consolidados

Os relatórios ficaram responsáveis pela análise final.

Essa área reúne:
- filtros;
- cards de resumo;
- gráficos;
- rankings;
- tabelas;
- visão por prova;
- visão por aluno;
- visão por questão;
- visão do feedback final da turma.

Exemplos de indicadores:
- quantidade de respondentes;
- média da prova;
- maior e menor nota;
- taxa de acerto;
- distribuição das notas;
- tempo médio;
- questões mais críticas;
- ranking de alunos;
- conteúdos frágeis;
- percepção da turma.

## 16. Exportação e compartilhamento

Na área de relatórios, o admin consegue:
- exportar o relatório em PDF;
- gerar um link compartilhável de visualização;
- ativar ou desativar esse link.

O PDF inclui, no mínimo:
- nome da prova;
- código;
- disciplina;
- quantidade de respondentes;
- média;
- resumo visual;
- questões críticas;
- alunos com maior dificuldade;
- informações relevantes do feedback final.

## 17. Sugestões e reporte de problemas

O sistema possui um botão global fixo em todas as páginas:
- “Sugestões / Reportar problema”

Esse recurso permite registrar:
- sugestão;
- erro;
- dúvida.

Campos principais:
- tipo;
- título;
- descrição;
- rota atual;
- contexto da página;
- imagem opcional.

Na administração existe uma área específica para:
- listar registros;
- filtrar por tipo;
- filtrar por status;
- visualizar detalhes;
- atualizar o status.

## 18. Organização funcional por módulo

Resumo dos módulos principais:

- Home pública
  entrada do aluno por código da prova

- Prova
  identificação, resolução, timer, confiança e envio

- Feedback final
  pesquisa estruturada e fechamento pedagógico

- Dashboard
  visão inicial do admin

- Provas
  gestão do ciclo de vida da avaliação

- Questões
  cadastro, edição, suporte visual e importação

- Turmas e disciplinas
  cadastros auxiliares e filtros

- Monitoramento
  acompanhamento em tempo real

- Relatórios
  análise consolidada e exportação

- Sugestões / Problemas
  canal global de melhoria e suporte

## 19. Principais diferenciais da solução

Os principais pontos fortes para apresentação são:
- acesso simples do aluno por código;
- separação clara entre operação e análise;
- coleta de percepção pedagógica além da nota;
- suporte visual e organização melhor das questões;
- relatórios com foco pedagógico;
- canal interno de melhoria contínua do sistema.

## 20. Limitações e observações do estado atual

Para apresentação, é importante falar com transparência sobre o que já está forte e o que ainda pode evoluir.

Hoje o projeto está funcional no fluxo principal, mas alguns pontos ainda podem crescer, por exemplo:
- amadurecimento de exportações adicionais além do PDF;
- ampliação de perfis com autenticação própria para visualizador;
- refinamentos futuros no fluxo de correção manual e anexos em respostas do aluno, se isso for necessário na próxima fase.

## 21. Roteiro curto para demonstrar o sistema

Se você quiser apresentar o sistema rapidamente, um roteiro bom é:

1. mostrar a tela pública e o acesso por código;
2. mostrar a identificação do aluno;
3. mostrar a tela da prova com timer e confiança;
4. mostrar a tela final com feedback pedagógico;
5. entrar no admin;
6. mostrar dashboard;
7. mostrar gestão de provas;
8. mostrar monitoramento;
9. mostrar relatórios;
10. mostrar exportação PDF e link compartilhável;
11. mostrar o botão global de sugestões e a área administrativa desses registros.

## 22. Resumo executivo

Em uma frase:

O AVA Online é uma plataforma de avaliações digitais com foco não só em aplicar provas, mas em transformar o resultado em acompanhamento pedagógico, análise operacional e melhoria contínua do processo de ensino.
