# Apresentacao do Sistema

Este documento resume o que o AVA Online faz hoje e ajuda na apresentacao do projeto.

## 1. O que e o AVA Online

O AVA Online e uma plataforma para:
- criar provas e questoes;
- aplicar avaliacoes online;
- acompanhar a aplicacao em tempo real;
- analisar resultados consolidados;
- coletar feedback pedagogico ao final da prova.

O foco do sistema e unir operacao da prova com leitura pedagogica dos resultados.

## 2. Perfis do sistema

Hoje o sistema possui quatro contextos de acesso:

### ADM
- acesso total ao sistema;
- gerencia provas, questoes, turmas, disciplinas, usuarios, monitoramento, relatorios e sugestoes.

### VISUALIZADOR
- acesso apenas a relatorios;
- nao pode editar dados;
- nao ve menus administrativos criticos.

### Aluno
- sem cadastro formal;
- entra pelo codigo da prova;
- informa nome, turma e disciplina;
- realiza a prova e responde o feedback final.

### Visualizacao externa por link
- relatorios tambem podem ser compartilhados por token;
- o link abre uma visao somente leitura.

## 3. Fluxo do aluno

1. o aluno entra na pagina inicial;
2. informa o codigo da prova;
3. o sistema valida disponibilidade e status;
4. abre a etapa de identificacao;
5. o aluno informa nome, turma e disciplina;
6. inicia a prova;
7. responde as questoes com nivel de confianca;
8. envia a prova;
9. responde o formulario pedagogico final;
10. visualiza o fechamento da prova com desempenho e orientacoes.

## 4. Provas

Cada prova hoje pode ter:
- nome;
- codigo publico unico;
- disciplina;
- duracao;
- status.

O admin pode:
- criar;
- editar;
- ativar;
- desativar;
- encerrar;
- excluir;
- monitorar;
- abrir relatorios.

## 5. Questoes

O sistema suporta:
- multipla escolha;
- texto curto;
- texto longo;
- envio de arquivo.

A estrutura visual segue:
1. contexto
2. suporte visual
3. comando da questao
4. alternativas

Cada questao pode ter tambem:
- feedback esperado;
- explicacao da resposta;
- temas para estudo;
- links de apoio;
- playlist ou URL de referencia;
- observacoes complementares.

## 6. Suporte visual e uploads

As questoes podem ter:
- imagem;
- arquivo de apoio;
- bloco de codigo.

O projeto agora suporta dois modos de armazenamento:

### Desenvolvimento local
- salva arquivos em `UPLOAD_DIR`

### Producao no Vercel
- salva arquivos no `Vercel Blob`
- usa `BLOB_READ_WRITE_TOKEN`

Isso vale para:
- apoio visual de questoes;
- imagem de sugestoes e reportes.

## 7. Tela da prova

A experiencia da prova mostra:
- contexto;
- suporte visual;
- comando;
- alternativas;
- nivel de confianca.

Tambem exibe:
- tempo decorrido;
- tempo restante;
- contagem regressiva;
- indicacao de questao respondida;
- indicacao de questao pendente;
- destaque claro de alternativa marcada;
- destaque claro do nivel de confianca.

## 8. Feedback final

Ao final da prova, o aluno responde um formulario estruturado com:
- dificuldade percebida;
- conteudos mais dificeis;
- tipo de dificuldade;
- percepcao do proprio desempenho;
- clareza das explicacoes;
- ritmo das aulas;
- utilidade dos exercicios;
- autonomia;
- formatos de aula;
- necessidade de revisao;
- dificuldade com ferramentas;
- comentario final.

## 9. Tela final do aluno

Depois do envio, o sistema pode mostrar:
- confirmacao de envio;
- pontuacao;
- acertos e erros;
- lista das questoes;
- explicacao de resposta;
- temas para revisao;
- materiais sugeridos;
- resumo final de estudo.

## 10. Dashboard admin

O dashboard inicial apresenta:
- cards com dados rapidos;
- resumo da ultima prova;
- indicadores recentes;
- atalhos para modulos principais.

## 11. Monitoramento

O monitoramento e operacional.

Ele mostra:
- provas em andamento;
- alunos em andamento;
- alunos finalizados;
- andamento geral da aplicacao;
- atualizacao automatica por polling.

## 12. Relatorios

A area de relatorios concentra:
- filtros;
- cards;
- graficos;
- rankings;
- desempenho por prova;
- desempenho por aluno;
- desempenho por questao;
- feedback final da turma.

Tambem permite:
- exportacao PDF;
- link compartilhavel;
- acesso por perfil `VISUALIZADOR`.

## 13. Sugestoes e reportes

Existe um botao global em todas as paginas:
- "Sugestoes / Reportar problema"

O formulario permite:
- sugestao;
- erro;
- duvida;
- anexo de imagem;
- captura de contexto da rota atual.

Na administracao existe uma area propria para triagem desses registros.

## 14. Diferenciais principais

Os principais pontos fortes do sistema sao:
- acesso do aluno por codigo simples;
- separacao entre monitoramento e relatorios;
- leitura pedagogica alem da nota;
- suporte visual e organizacao melhor das questoes;
- controle de usuarios internos por perfil;
- canal de melhoria continua do proprio sistema.

## 15. Roteiro curto de demonstracao

Se quiser apresentar rapidamente:

1. mostre a home publica
2. valide um codigo de prova
3. mostre a identificacao do aluno
4. mostre a tela da prova com timer e confianca
5. mostre a etapa final de feedback
6. entre como `ADM`
7. mostre dashboard, provas, relatorios e usuarios
8. mostre um login `VISUALIZADOR`
9. mostre o botao global de sugestoes
10. mostre a area administrativa desses registros

## 16. Resumo executivo

Em uma frase:

O AVA Online e uma plataforma de avaliacoes digitais que combina aplicacao de provas, acompanhamento operacional e leitura pedagogica dos resultados em um unico sistema.
